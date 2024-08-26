const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const flightSchema = new Schema ({
    flightNumber:{
        type : Number,
        required : true,
        unique : true
    },
    description :{
        type:String,
        required:true
    },
    airLine:{
        type:String,
        required:true
    },
    departureAirport:{
        type :Schema.Types.ObjectId,
        ref:'Airport',
    },
    arrivalAirport:{
        type :Schema.Types.ObjectId,
        ref:'Airport',
    },
    departureTime:{
        type:Date, 
        required:true
    },
    arrivalTime:{
        type:Date, 
        required:true
    },
    price:{
        type:Number,
        required:true
    },
    imageUrl : [
        {
            type:String,
            required:true,
        }
    ]
}) 


module.exports=mongoose.model('Flight',flightSchema);