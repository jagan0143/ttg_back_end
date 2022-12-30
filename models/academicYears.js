const mongoose = require('mongoose');
const {Schema} = mongoose;

const year_schema = new Schema({
    start_year: {
        type: Number,
        required: true
    },
    end_year: {
        type: Number,
        required: true
    },
    status: {
        type: Number,
        required: true
    }
});

module.exports = mongoose.model('year', year_schema);



