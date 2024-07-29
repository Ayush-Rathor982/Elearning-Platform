const mongoose = require('mongoose');
const validator = require('validator');

const paymentSchema = mongoose.Schema({
    student_name : {
        type:String,
        required:true
    },
    student_email : {
        type:String,
        required:true,
    },
    student_id : {
        type:String,
        required:true
    },
    course_price : {
        type:Number
    },
    course_id : {
        type:String
    },
    course_name : {
        type:String
    },
    razorpay_payment_id : {
        type:String
    },
    razorpay_order_id : {
        type:String
    },
    razorpay_signature : {
        type:String
    },
    payment_date:{
        type:Date,
        default:Date.now
    },
    payment_time: {
        type: String,
        default: () => {
            const now = new Date();
            return `${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`;
        }
    }
});

const Payments = mongoose.model("payment",paymentSchema);

module.exports = Payments;