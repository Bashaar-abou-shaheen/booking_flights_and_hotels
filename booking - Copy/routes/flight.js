const express = require('express')
const router = express.Router()
const {checkSchema, validationResult} = require('express-validator')


const isAuth = require('../middleware/isAuth.js')
const flightController = require('../controllers/flight.js');


// to book a flight 
// localhost:3000/flights/bookflight:flightId
router.put('/bookflight/:flightId' ,isAuth, flightController.bookFlight)


// to get flights depends on continent
// localhost:3000/flights?vibe=''
router.get('/flightsbyvibe',isAuth,flightController.getFlightsDependensOnVibe); 

 
// to get trending flight
// localhost:3000/flights/trendingflights
router.get('/trendingflights',isAuth,flightController.getTrendingFlights); 


// to get flights depends on continent
// localhost:3000/flights?continent=''
router.get('/flightsbycontinent',isAuth,flightController.getFlightsDependensOnContinent); 


// to get the available seats 
// localhost:3000/flights/getAvailableSeats/:flightId
router.get('/getAvailableSeats/:flightId',isAuth,flightController.getAvailableSeats); 

// to add favorite flight 
// localhost:3000/flights/addFavoriteFlight
router.post('/addFavoriteFlight/:flightId',isAuth,flightController.addFavoriteFlight);

// to delete favorite flight 
// localhost:3000/flights/deleteFavoriteFlight
router.delete('/deleteFavoriteFlight/:flightId',isAuth,flightController.deleteFavoriteFlight); 

// to get favorite flight 
// localhost:3000/flights/getFavoriteFlight
router.get('/getFavoriteFlight',isAuth,flightController.getFavoriteFlights);



// To fetch flights by search. ==> GET
// localhost:3000/flights/flights
router.post('/flights',isAuth,flightController.getFlightsBySearch)   // 


const forDatabase = require('../controllers/forDatabase.js')
router.post('/createAllData',forDatabase.createAllData)
// router.post('/createFlight',flightController.createFlight)



module.exports=router;