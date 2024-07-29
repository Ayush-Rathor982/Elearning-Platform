const mongoose = require('mongoose');
const validator = require('validator');

const feedbackSchema = mongoose.Schema({
    student_name : {
        type:String
    },
    student_id : {
        type:String
    },
    course_id : {
        type:String
    },
    course_name : {
        type:String
    },
    feedback : {
        type:String
    }
});

const Feedback = mongoose.model("feedback",feedbackSchema);

module.exports = Feedback;