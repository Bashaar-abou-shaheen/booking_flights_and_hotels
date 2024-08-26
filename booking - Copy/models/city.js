const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const citySchema = new Schema ({
    name:{
        type:String,
        required:true
    },
    
    country:{
        type:String,
        required:true
    },

    continent: {
        type:String,
        required:true,
        enum: ['africa', 'antarctica', 'asia' , 'europe','northamerica' , 'southamerica' , 'oceania']
    },

    vibe: {
        type:String,
        required:true,
        enum: ['romantic','sightseeing','nightlife','citytrip','budjetfriendly']
    }, 

    imageUrl : {
        type:String,
        required:true,
    }

}) 


module.exports=mongoose.model('City',citySchema);