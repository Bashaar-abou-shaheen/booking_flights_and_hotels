const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const favoriteFlightSchema = new Schema ({
    user:{
        type :Schema.Types.ObjectId,
        ref:'User',
        required:true
    },
    flight:{
        type :Schema.Types.ObjectId,
        ref:'Flight',
        required:true
    },
    addedAt:{
        type:Date,
        default:Date.now()
    }
})


module.exports=mongoose.model('FavoriteFlight',favoriteFlightSchema);