const express = require('express');
const app = express(); 
const bodyParser = require('body-parser');
const mongoose = require('./db/mongoose');

//load in db modules
const { List, Task } = require('./db/models') 


//load body-parser middleware
app.use(bodyParser.json());


//Route handlers

//List Route
/**
 * GET /lists the purpose is to get all the lists
 */
app.get("/lists", (req, res)=>{
    //return an array of the lists in the dbs
    List.find({}).then((lists)=>{
        res.send(lists);
    })
})

//POST /lists creates a new list
app.post("/lists", (req, res)=>{
    //create a new list and return the new list docs to user
    //list info fields will be passed in via json req body
    let title = req.body.title;

    let newList = new List({
        title
    })
    newList.save().then((listDoc)=>{
        //the full list doc is returned incl id
        res.send(listDoc);
    })
})


//update a specified list
app.patch("/lists/id", (req, res)=>{
    //update the list with the new values spec by json req
})

//delete a list
app.delete("/lists", (req, res)=>{
    //delete a specified list
})

//starting a dev port
app.listen(3000, ()=>{
    console.log('Server is listening on port 3000');
})