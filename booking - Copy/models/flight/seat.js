const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const seatSchema = new Schema({
    seatNumber: {       //The seat number and not the number of seats
        type: String, 
        required: true 
    },
    seatClass: { 
        type: String, 
        required: true, 
        enum: ['economy', 'business', 'first']
    },
    isAvailable: { 
        type: Boolean, 
        default: true 
    },
    flight: {
        type: Schema.Types.ObjectId,
        ref: 'Flight',
        required: true
    }
});

module.exports=mongoose.model('Seat',seatSchema);