const mongoose = require('mongoose');


const planetsSchema = new mongoose.Schema({
    keplerName: {
        type: String,
        require: true,
    }
});


module.exports = mongoose.model('Planet', planetsSchema);
