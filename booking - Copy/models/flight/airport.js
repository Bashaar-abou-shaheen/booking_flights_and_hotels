const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const airportSchema = new Schema ({
    name:{
        type:String,
        required:true
    },
    code:{
        type : Number,
        required : true,
        unique : true
    },
    city:{
        type :Schema.Types.ObjectId,
        ref:'City',
    }

}) 


module.exports=mongoose.model('Airport',airportSchema);