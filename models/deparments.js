const mongoose = require('mongoose');
const {Schema} = mongoose;

const dept_schema = new Schema({
    dept_name: {
        type: String,
        required: true
    },
    dept_code: {
        type: String,
        required: true
    },
    year_id: {
        type: String,
        required: true 
    },
    status: {
        type: Number,
        required: true
    }
});

module.exports = mongoose.model('department', dept_schema);



