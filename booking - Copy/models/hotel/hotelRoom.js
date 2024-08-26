const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const roomSchema = new Schema({
    roomNumber: {       //The room number and not the number of rooms
        type: String, 
        required: true 
    },
    roomClass: { 
        type: String, 
        required: true, 
        enum: ['single', 'double', 'twin','triple','quad','presidential']
    },
    description:{
        type :String,
        required : true,
    },
    isAvailable: { 
        type: Boolean, 
        default: true 
    },
    hotel: {
        type: Schema.Types.ObjectId,
        ref: 'Hotel',
        required: true
    },
    imageUrl : {
        type:String,
        required:true,
    }
});

module.exports=mongoose.model('Room',roomSchema);