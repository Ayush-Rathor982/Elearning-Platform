const mongoose = require('mongoose');

const querySchema = mongoose.Schema({
    course_name : {
        type:String
    },
    course_id : {
        type:String
    },
    student_name : {
        type:String
    },
    student_id : {
        type:String
    },
    query_asked : {
        type:String
    },
    query_reply : {
        type:String
    },
});

const Queries = mongoose.model("query",querySchema);

module.exports = Queries;