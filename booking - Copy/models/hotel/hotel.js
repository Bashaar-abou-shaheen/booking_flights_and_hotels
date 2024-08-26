const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const hotelSchema = new Schema ({
    name:{
        type : String,
        required : true
    },
    city:{
        type :Schema.Types.ObjectId,
        ref:'City',
    },
    description:{
        type :String,
        required : true,
    },
    isAcceptPets: {
        type:Boolean,
        default:true
    },
    rating:{
        type: Number, 
        min: 0, 
        max: 5 ,
        required : true
    },
    pricePerNight:{
        type:Number,
        required:true
    },
    imageUrl : {
        type:String,
        required:true,
    }
}) 


module.exports=mongoose.model('Hotel',hotelSchema);