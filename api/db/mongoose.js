
//Db connection scripts

const mongoose = require('mongoose');

mongoose.Promise = global.Promise;

mongoose.connect('mongodb://localhost:27017/TaskManager', 
                {useNewUrlParser : true}).then(()=>{
                    console.log('Connected to MongoDB')
                }).catch((e)=>{
                    console.log('Error while connecting to MongoDB');
                    console.log(e);
                })

//to prevent deprecion warings 
mongoose.set('useCreateIndex', true);
mongoose.set('useFindAndModify', false);

module.exports = { mongoose };