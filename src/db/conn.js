const mongoose = require('mongoose');
// const Grid = require('gridfs-stream');

mongoose.connect("mongodb://0.0.0.0:27017/DataBase")
.then(()=>console.log("connection Successfull......"))
.catch((e)=>
console.log("connection error " + e));


