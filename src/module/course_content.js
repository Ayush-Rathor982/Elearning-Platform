const mongoose = require('mongoose');

const courseContentSchema = mongoose.Schema({
    course_id : {
        type:String
    },
    course_name : {
        type:String
    },
    topic_name : {
        type:String
    },
    content_name : {
        type:String
    },
    videoData: Buffer 
});

const course_contents = mongoose.model("course_content",courseContentSchema);

module.exports = course_contents;