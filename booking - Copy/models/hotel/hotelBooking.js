const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const hotelBookingSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
    },
    hotel: {
        type: Schema.Types.ObjectId,
        ref: 'Hotel',
    },
    roomNumbers: [
        {
            type: Schema.Types.ObjectId, 
            ref: 'Room',
            required: true
        }
    ],
    bookingDate: {
        type: Date,
        default:Date.now()
    },
    checkInDate:{
        type: Date,
        required : true
    },
    checkOutDate:{
        type: Date,
        required : true
    },
    numberOfRooms: {
        type: Number,
        required: true,
        default: 1
    },
    numberOfAdults: {
        type: Number,
        required: true,
        default: 1
    },
    numberOfChildrens : {
        type: Number,
        required: true,
        default: 0
    },
    price: {
        type: Number,
        required: true
    }
});


module.exports=mongoose.model('HotelBooking',hotelBookingSchema);