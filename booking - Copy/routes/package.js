const express = require('express')
const router = express.Router()
const { body , check} = require('express-validator')


const isAuth = require('../middleware/isAuth.js')
const packageController = require('../controllers/package.js');


// To fetch packages by search.
// localhost:3000/packages/packagesbysearch
router.get('/packagesbysearch',isAuth,packageController.getFlightsAndHotelsBySearch)

router.get('/available' ,isAuth,packageController.getAvailable)

router.post('/bookpackage',isAuth,packageController.bookPackage)


module.exports=router;


