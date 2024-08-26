const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const hotelRoomSchema = new Schema({
    room: {
        type: Schema.Types.ObjectId,
        ref: 'Room',
        required: true
    },
    checkInDate:{
        type: Date,
        required : true
    },
    checkOutDate:{
        type: Date,
        required : true
    }
});

module.exports=mongoose.model('RoomBooking',hotelRoomSchema);