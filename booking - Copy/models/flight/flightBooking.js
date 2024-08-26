const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const flightBookingSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
    },
    flight: {
        type: Schema.Types.ObjectId,
        ref: 'Flight',
    },
    bookingDate: {
        type: Date,
        default:Date.now()
    },
    numberOfAdults: {
        type: Number,
        required: true,
        default: 1
    },
    numberOfChildrens: {
        type: Number,
        required: true,
        default: 0
    },
    seatNumbers: [
        {
            type: Schema.Types.ObjectId, 
            ref: 'Seat',
            required: true
        }
    ],
    price: {
        type: Number,
        required: true
    }
});


module.exports=mongoose.model('FlightBooking',flightBookingSchema);