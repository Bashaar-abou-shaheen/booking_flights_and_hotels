const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const favoriteHotelSchema = new Schema ({
    user:{
        type :Schema.Types.ObjectId,
        ref:'User',
        required:true
    },
    hotel:{
        type :Schema.Types.ObjectId,
        ref:'Hotel',
        required:true
    },
    addedAt:{
        type:Date,
        default:Date.now()
    }
})


module.exports=mongoose.model('FavoriteHotel',favoriteHotelSchema);