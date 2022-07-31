const request = require('supertest');
const app = require('../../app');
const {
    mongoConnect,
    mongoDisconnect,
} = require('../../services/mongo')

describe('Launches API', () => {
    beforeAll(async () => {
        await mongoConnect();
    })

    afterAll(async () => {
        await mongoDisconnect();
    })

    describe('Test GET /launches', () => {
        test('It should respond with 200 success', async () => {
            const response  = await request(app)
                .get('/v1/launches')
                .expect('Content-Type', /json/)
                .expect(200);
        })
    })
    
    
    describe('Test POST /launch', () => {
    
        const completeLaunchData = {
                mission: 'USS ENterprise',
                rocket: 'NCC 1701-D',
                tartget: 'Kepler-1649 b',
                launchDate: 'Juanuary 4, 2028',   
        };
        
        const launchDataWithoutDate = {
                mission: 'USS ENterprise',
                rocket: 'NCC 1701-D',
                tartget: 'Kepler-1649 b',
    
        }
    
        test('It should respond with 201 created', async () => {
            const response  = await request(app)
                .post('/v1/launches')
                .send(completeLaunchData)
                .expect('Content-Type', /json/)
                .expect(201);
            
            const requestDate = new Date(completeLaunchData.launchDate).valueOf();
            const responseDate = new Date(response.body.launchDate).valueOf()
            expect(responseDate).toBe(requestDate)
    
            expect(response.body).toMatchObject(launchDataWithoutDate)
        })
    
        test('It should catch missing required properties', () => {})
    })

})
