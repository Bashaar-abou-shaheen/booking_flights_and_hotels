const express = require('express')
const router = express.Router()
const { body , check} = require('express-validator')

const cartController = require('../controllers/cart.js')
const isAuth = require('../middleware/isAuth.js')

//GET 
///cart/allReservations
router.get("/allReservations"  ,isAuth, cartController.getAllReservations)

//post
///cart/pay
router.post("/pay",isAuth, cartController.pay)



module.exports=router;