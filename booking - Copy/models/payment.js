const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const paymentSchema = new Schema({
    user: {
        type: String, 
        required: true 
    },
    bookingType: { 
        type: String, 
        required: true, 
        enum: ['flight', 'hotel']
    },
    hotelBooking: {
        type: Schema.Types.ObjectId,
        ref: 'HotelBooking',
        // required: true
    },
    flightBooking: {
        type: Schema.Types.ObjectId,
        ref: 'FlightBooking',
        // required: true
    },
    Date:{
        type: Date,
        default:Date.now() 
    },
    method:{
        type: String, 
        required: true, 
        enum: ['cash', 'creditcard' , 'paypal']
    }
});

module.exports=mongoose.model('Payment',paymentSchema);