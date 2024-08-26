const express = require('express')
const router = express.Router()
const { body , check} = require('express-validator')


const isAuth = require('../middleware/isAuth.js')
const hotelController = require('../controllers/hotel.js');



// to book a room 
// localhost:3000/hotels/bookhotel:hotelId
router.put('/bookhotel/:hotelId' ,isAuth, hotelController.bookHotel)



// to get flights depends on continent
// localhost:3000/hotels/hotelsbycityname?city=''
router.get('/hotelsbycityname',isAuth,hotelController.getHotelssDependensOnCityName); 


// to get hotels depends on vibes
// localhost:3000/hotels/flightsbyvibe?vibe=''
router.get('/flightsbyvibe',isAuth,hotelController.getHotelsDependensOnVibe); 


// to get trending hotels
// localhost:3000/hotels/trendinghotels
router.get('/trendinghotels',isAuth,hotelController.getTrendingHotels); 



// to get flights depends on continent
// localhost:3000/hotels/hotelsbycontinent?continent=''
router.get('/hotelsbycontinent',isAuth,hotelController.getHotelssDependensOnContinent); 


// to get the available rooms 
// localhost:3000/hotels/getAvailablerooms/:hotelId
router.get('/getAvailablerooms/:hotelId',isAuth,hotelController.getAvailableRooms); 


// to add favorite hotel
// localhost:3000/hotels/addFavoriteHotel
router.post('/addFavoriteHotel/:hotelId',isAuth,hotelController.addFavoriteHotel);

// to delete favorite hotel
// localhost:3000/hotels/deleteFavoriteHotel
router.delete('/deleteFavoriteHotel/:hotelId',isAuth,hotelController.deleteFavoriteHotel); 

// to get favorite hotels
// localhost:3000/hotels/getFavoriteHotels
router.get('/getFavoriteHotels',isAuth,hotelController.getFavoriteHotels);


// To fetch hotels by search.
// localhost:3000/hotels/hotels
router.get('/hotels',[
    body('city' , 'Please enter a city')
        .trim()
        .customSanitizer(value => value.toLowerCase())
        .not()
        .isEmpty(),

],isAuth,hotelController.getHotelsBySearch)




// router.post('/createHotel',hotelController.createHotel)



module.exports=router;