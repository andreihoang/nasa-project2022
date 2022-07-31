const axios = require("axios");

const launchesDatabase = require('./launches.mongo');
const planets = require('./planet.mongo');

const DEFAULT_FLIGHT_NUMBER = 100;

const SPACEX_API_URL = 'https://api.spacexdata.com/v4/launches/query';

async function loadLaunchData() {
    const firstLaunch = await findLaunch({
        flightNumber: 1,
        rocket: 'Falcon 1',
        mission: 'FalconSat',
    })
    if (firstLaunch) {
        console.log('launch already loaded!');
        return;
    }
    console.log("Load launch data.....");
    const response = await axios.post(SPACEX_API_URL, {
            query: {},
            options: {
                pagination: false, 
                populate: [
                    {
                    path: 'rocket',
                    select: {
                        name: 1
                        }
                    },
                    {
                        path: 'payloads',
                        select: {
                            'customers': 1
                        }
                    }
                ]
            }
        
    });

    if (response.status !== 200) {
        console.log('Problem downloading data');
        throw new Error('failed')
    }

    const launchDocs = response.data.docs;

    for (const launchDoc of launchDocs) {
        const payloads = launchDoc['payloads'];
        const customers = payloads.flatMap((payload) => {
            return payload['customers'];
        })
        const launch = {
            flightNumber: launchDoc['flight_number'],
            mission: launchDoc['name'],
            rocket: launchDoc['rocket']['name'],
            launchDate: launchDoc['date_local'],
            upcoming: launchDoc['upcoming'],
            success: launchDoc['success'],
            customers: customers,
        };

        console.log(`${launch.flightNumber}`)
        await saveLaunch(launch);
    }
}

async function findLaunch(filter) {
    return await launchesDatabase.findOne(filter);
}

async function existsLaunchWithId(launchId) {
    return await findLaunch({
        flightNumber: launchId,
    });
}

async function getAllLaunches(skip, limit) {
    return await launchesDatabase
        .find({}, {"_id": 0, "__v": 0})
        .sort({ flightNumber: 1 })
        .skip(skip)
        .limit(limit);
}

async function getLatestFlightNumber() {
    const latestLaunch = await launchesDatabase
        .findOne({})
        .sort('-flightNumber');
        
    if (!latestLaunch) {
        return DEFAULT_FLIGHT_NUMBER;
    }
    return latestLaunch.flightNumber;
} 

async function saveLaunch(launch) {
    try {
        await launchesDatabase.findOneAndUpdate({
            // if this launches already exist in database, if not insert
            flightNumber: launch.flightNumber,
        }, launch, {
            upsert: true,
        })
    } catch(err) {console.log(err)};

    }

async function scheduleNewLaunch(launch) {
        const planet = await planets.findOne({
            keplerName: launch.target,
        });
        
        if (!planet) {
            throw new Error('No matching planet found')
        }
    
        const newFlightNumber = await getLatestFlightNumber() + 1;

        const newLaunch = Object.assign(launch, {
            success: true,
            upcoming: true,
            customers: ['ZTM', 'NASA'],
            flightNumber: newFlightNumber,
        })

        await saveLaunch(newLaunch)
    }


async function abortLaunchById(launchId) {
    // const aborted = launches.get(launchId);
    // aborted.upcoming = false;
    // aborted.success = false;
    // return aborted
   const aborted =  await launchesDatabase.updateOne({
        flightNumber: launchId,
    }, {
        upcoming: false,
        success: false,
    });
    return aborted.modifiedCount === 1;
}

module.exports = {
    getAllLaunches,
    existsLaunchWithId,
    abortLaunchById,
    scheduleNewLaunch,
    loadLaunchData
}