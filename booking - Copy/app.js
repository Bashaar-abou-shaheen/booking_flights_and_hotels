const express = require('express');
const app =express();
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const path = require('path')
const passport = require('passport')
const session = require('express-session');
const dotenv = require('dotenv');

const authRoutes = require("./routes/auth.js")
const flightRoutes = require('./routes/flight.js')
const hotelsRoutes = require('./routes/hotel.js')
const cartRoutes = require('./routes/cart.js')
const packageRoutes = require('./routes/package.js')

dotenv.config();

app.use(bodyParser.json());

app.use(session({ secret: process.env.JWT_SECRET, resave: false, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());



const MONGODB_URI= process.env.MONGO_URI;

app.use((req, res,next)=>{        // to make the site work on another server      (((  fix --CORS-- Error  )))
    res.setHeader('Access-Control-Allow-Origin',"*")        // to make it work in all domain
    res.setHeader('Access-Control-Allow-Methods','GET,POST,PUT,PATCH,DELETE')   // to make the methods work the other domain
    res.setHeader('Access-Control-Allow-Headers','Content-Type , Authorization')    // we need Authorization for token
    next();
})



app.use('/images', express.static(path.join(__dirname, 'images')));

app.use('/auth',authRoutes)
app.use('/flights',flightRoutes)
app.use('/hotels',hotelsRoutes)
app.use('/cart',cartRoutes)
app.use('/packages',packageRoutes)

app.use((error,req,res,next)=>{
    console.log(error);
    const status = error.statusCode || 500;
    const message = error.message;
    res.status(status).json({message : message})
});

mongoose.connect(MONGODB_URI)
    .then(()=>{
        app.listen(process.env.PORT)
    })
    .catch(err=>{
        console.log(err);
    });
