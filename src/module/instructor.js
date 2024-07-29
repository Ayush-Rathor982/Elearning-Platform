const mongoose = require('mongoose');
const validator = require('validator');

const instructorSchema = mongoose.Schema({
    instructor_name : {
        type:String,
        required:true
    },
    instructor_email : {
        type:String,
        required:true,
        unique:[true,"Email already exist"],
        validate(value){
            if(!validator.isEmail(value)){
                throw new Error('Invalid Email')
            }
        }
    },
    instructor_pass : {
        type:String,
        required:true
    },
    instructor_img : {
        data : Buffer,
        contentType : String
    },
    instructor_phone : {
        type:Number,
        min:10,
    },
    instructor_address : {
        type:String
    }
});

const Instructor = mongoose.model("instructor",instructorSchema);

module.exports = Instructor;