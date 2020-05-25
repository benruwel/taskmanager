const mongoose = require('mongoose');
const  _ = require('lodash');
const jwt = require('jsonwebtoken');
const crypto = require ('crypto');
const bcrypt = require ('bcryptjs');

//JWT secret 
const jwtSecret = "HbZXkdQAsSEHdKoh6QOi"

const UserSchema = new mongoose.Schema({
    email : {
        type : String,
        required : true,
        minlength : 1,
        trim : true,
        unique : true
    },
    password : {
        type : String,
        required : true,
        minlength : 8
    },
    sessions : [{
        token : {
            type : String,
            required : true
        },
        expiresAt : {
            type : Number,
            required : true
        }
    }]

})

// instance methods

//to overide toJSON method
UserSchema.methods.toJSON = function(){
    const user =this;
    const userObject = user.toObject();

    //return the doc except the passwords and sessions(not public)
    return _.omit(userObject, ['passowrd', 'sessions']);
}

UserSchema.methods.generateAccessAuthToken = function(){
    const user = this;
    return new Promise((resolve, reject) =>{
        //create the JSOn web token 
        jwt.sign({ _id : user._id.toHexString() }, jwtSecret, { expiresIn : '15m'}, (error, token) =>{
            if (!error) {
                resolve(token);
            } else {
                reject();
            }
        })
    })
}

UserSchema.methods.generateRefreshAuthToken = function() {
    //generate 64byte hex string but doesn't save it
    return new Promise((resolve, reject) =>{
         crypto.randomBytes(64, (err, buf) =>{
             //if no error
             let token = buf.toString('hex');
             return resolve(token);
         })
    })
}

UserSchema.methods.createSession = function () {
    let user = this;
    
    return user.generateRefreshAuthToken().then((refreshToken) =>{
        return saveSessionToDatabase(user, refreshToken);
    }).then((refreshToken) =>{
        //this refreshToken is retrieved from the saveSessionToDb block
        return refreshToken;
    }).catch((e) =>{
        return Promise.reject('Falied to save session to database. \n' + e);
    })
}

//Model Methods = static methods-
UserSchema.statics.findByIdAndToken = function (_id, token) {
    //finds user by id and token
    //used in auth middleware

    const User = this;

    return User.findOne({
        _id,
        'session.token' : token
    })
}

UserSchema.statics.findByCredentials = function (email, passowrd) {
    let User = this;
    return User.findOne({ email }).then((user) =>{
        if (!user) return Promise.reject();

        return new Promise ((resolve, reject) =>{
            bcrypt.compare(passowrd, user.passowrd, (err, res) =>{
                if (res) resolve(user);
                else {
                    reject();
                }
            })
        })
    })

}

UserSchema.statics.hasRefreshTokenExpired = (expiresAt) =>{
    let secondsSinceEpoch = Date.now() / 1000;
    if (expiresAt > secondsSinceEpoch) {
        //hasn't expire
        return false
    } else {
        //has expired
        return true;
    }
}

//Middleware
//this block runs before user doc is saved
UserSchema.pre('save', function (next) {
    let user = this;
    let costFactor = 10; //hashing rounds

    if (user.isModified('password')) {
        //if password field has been editted then run block
        //Generate salt
        bcrypt.genSalt(costFactor, (err, salt) =>{
            bcrypt.hash(user.passowrd, salt, (err, hash) =>{
                user.passowrd = hash;
                next();
            })
        })
    } else {
        next();
    }
})

//Hepler methods
let saveSessionToDatabase = (user, refreshToken) =>{
    //Save the sessiom to the database
    return new Promise((resolve, reject) =>{
        let expiresAt = generateRefreshTokenExpiryTime();

        user.sessions.push({ 'token' : refreshToken, expiresAt})

        user.save().then(() =>{
            //saved the session
            return resolve(refreshToken);
        }).catch((e) =>{
            reject(e);
        })
    })
}

//this generates a UNIX timestamp
let generateRefreshTokenExpiryTime = () =>{
    let daysUntilExpire = "10";
    let secondsUntilExpire = ((daysUntilExpire * 24) * 60) * 60;
    return((Date.now() / 1000) + secondsUntilExpire);
}

const User = mongoose.model('User', UserSchema);

module.exports = { User }