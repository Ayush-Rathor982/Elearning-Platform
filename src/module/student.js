const mongoose = require('mongoose');
const validator = require('validator');

const studentSchema = mongoose.Schema({
    student_name : {
        type:String,
        required:true
    },
    student_email : {
        type:String,
        required:true,
        unique:[true,"Email already exist"],
        validate(value){
            if(!validator.isEmail(value)){
                throw new Error('Invalid Email')
            }
        }
    },
    student_pass : {
        type:String,
        required:true
    },
    student_img : {
        data : Buffer,
        contentType : String
    },
    phone : {
        type:Number,
        min:10,
    },
    address : {
        type:String
    }
});

const Student = mongoose.model("student",studentSchema);

module.exports = Student;