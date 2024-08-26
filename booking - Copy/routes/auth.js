const express = require('express')
const router = express.Router()
const { body , check} = require('express-validator')
const passport = require('passport');

const authController = require('../controllers/auth.js')
const User = require('../models/user.js')
const isAuth = require('../middleware/isAuth.js')

require('../config/passport.js');


router.get('/google', authController.googleAuth);

router.get('/loginbygoogle', authController.googleCallback);

router.get('/google/success', (req, res) => {
    res.json({ message: 'Authentication successful', token: req.query.token });
});


// PUT ==> signup
// auth/signup
router.put('/signup',[
    body('name' , 'Please enter your name')
        .trim()
        .not()
        .isEmpty(),
    body('email')
        .isEmail()
        .withMessage('Please enter a valid email')
        .normalizeEmail()
        .custom((value , { req })=>{
            return User.findOne({email : value})
                        .then(userDoc=>{
                            if(userDoc){
                                return Promise.reject('Email is already exist !')
                            }
                        })
        }),
    body('password' , "Please enter at least 5 charachter")
        .trim()
        .isLength({min : 5}), 
    body('confirmPassword')
        .trim()
        .custom((value,{req})=>{
            if (value !== req.body.password){
                throw new Error ('passwords have to match')
            }
            return true
        })
],authController.signup)


// POST  ==> login
// auth/login
router.post('/login',[
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please enter a valid email')
        .custom((value , { req })=>{
            return User.findOne({email : value})
                        .then(userDoc=>{
                            if(!userDoc){
                                return Promise.reject('this email is not exist !')
                            }
                        })
        }),
    body('password' , "Please enter at least 5 charachter")
        .trim()
        .isLength({min : 5})
],authController.login)


// auth/logout
router.post('/logout',isAuth,authController.logout) 

 

module.exports=router;