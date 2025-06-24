
var mongoose = require("mongoose");

mongoose.connect("url")
.then(()=>{
    console.log("Db connected")
})
.catch((err)=>{
    console.log(err)
});
