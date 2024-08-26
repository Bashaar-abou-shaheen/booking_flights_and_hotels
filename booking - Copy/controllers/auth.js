const { validationResult } =require('express-validator')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const passport = require('passport')


const User = require('../models/user')

exports.signup = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const error = new Error(errors.array()[0].msg);
            error.statusCode = 422;
            error.data = errors.array();
            throw error;
        }

        const { name, email, password } = req.body;
        const hashedPass = await bcrypt.hash(password, 12);
        const user = new User({
            name: name,
            email: email,
            password: hashedPass
        });
        const result = await user.save();
        const token = jwt.sign(
            {
                email: result.email,
                userId: result._id.toString(),
            },
            process.env.JWT_SECRET, 
            { expiresIn: '200h' }
        );

        res.status(200).json({
            message: 'userCreated',
            token: token,
            userId: result._id.toString(),
        });

    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

exports.login=async (req,res,next)=>{
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const error = new Error(errors.array()[0].msg);
            error.statusCode = 422;
            error.data = errors.array();
            throw error;
        }

        const { email, password} = req.body;
        let loadedUser;
        const user = await User.findOne({email : email})
        if(!user){
            const error = new Error ('the user with this email is not exist')
            error.statusCode = 422
            throw error
        }
        loadedUser = user
        const isEqual = await bcrypt.compare(password,user.password)

        if(!isEqual){
            const error = new Error ('wrong password !')
            error.statusCode = 422 
            throw error
        }

        const token = jwt.sign(
            {   
                email:loadedUser.email,
                userId : loadedUser._id.toString()
            },
            process.env.JWT_SECRET,
            { expiresIn: '200h' }
        );

        res.status(200).json(
            {
                token:token ,
                userId:loadedUser._id.toString()
            }
        );

    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }

}

exports.googleAuth = passport.authenticate('google', { scope: ['profile', 'email'] });

exports.googleCallback = (req, res, next) => {
    passport.authenticate('google', (err, user) => {
        if (err || !user) {
            return res.status(401).json({ message: 'Authentication failed' });
        }
        const token = jwt.sign(
            {   
                email:user.email,
                userId : user._id.toString()
            },
            process.env.JWT_SECRET,
            { expiresIn: '200h' }
        );
        console.log(token)
        res.redirect(`/auth/google/success?token=${token}`);        
    })(req, res, next);
};


exports.logout=(req,res,next)=>{
    req.get('Authorization').split(' ')[1]=null;
    res.status(201).json({ message: 'Logged out successfully' });
};