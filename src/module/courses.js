const mongoose = require('mongoose');

const courseSchema = mongoose.Schema({
    course_name : {
        type:String
    },
    course_field : {
        type:String
    },
    course_desc : {
        type:String
    },
    course_price : {
        type:Number
    },
    course_img : {
        data : Buffer,
        contentType : String
    },
    instructor_id : {
        type:String
    }
});

const Courses = mongoose.model("course",courseSchema);

module.exports = Courses;