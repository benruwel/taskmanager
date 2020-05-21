const express = require('express');
const app = express(); 
const bodyParser = require('body-parser');
const mongoose = require('./db/mongoose');




//load body-parser middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));


//load in db modules
const { List, Task } = require('./db/models') 


//Route handlers

//sets CORS headers to the responses
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*"); // update * to match the domain you will make the request from
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
  });

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
app.patch("/lists/:id", (req, res)=>{
    //update the list with the new values spec by json req
    List.findOneAndUpdate(
        { _id: req.params.id }, 
        {$set: req.body}). then(()=>{
            res.sendStatus(200);
        })
})

//delete a list
app.delete("/lists/:id", (req, res)=>{
    //delete a specified list
    List.findOneAndDelete({
        _id: req.params.id
    }).then((removedListDoc)=>{
        res.send(removedListDoc);
    })
})

//routes for tasks
app.get('/lists/:listId/tasks', (req, res)=>{
    //return tasks corresponding to its list
    Task.find({
        _listId: req.params.listId
    }).then((tasks)=>{
        res.send(tasks);
    })

    //this sends a GET req to a specific taskId
    // app.get('/lists/:listId/tasks/:taskId', (req, res)=>{
    //     Task.findOne({
    //         _id : req.params.taskId,
    //         _listId : req.params.listId
    //     }).then((tasks) =>{
    //         res.send(tasks);
    //     })
    // })

app.post('/lists/:listId/tasks', (req, res)=>{
    //creating new tasks

    let newTask = new Task({
        title : req.body.title,
        _listId: req.params.listId
    })
    newTask.save().then((newTaskDoc)=>{
        res.send(newTaskDoc);
    })
})

})

//patch route
app.patch('/lists/:listId/tasks/:taskId', (req, res)=>{
    Task.findOneAndUpdate({ 
        _id : req.params.taskId,
        _listId : req.params.listId
     }, {
         $set : req.body
     }).then(()=>{
         res.sendStatus(200);
     })
})

//delete route
app.delete('/lists/:listId/tasks/:taskId', (req, res)=>{
    Task.findByIdAndDelete({
        _id : req.params.taskId,
        _listId : req.params.listId
    }).then((removedTaskDoc)=>{
        res.send(removedTaskDoc);
    })
})

//starting a dev port
app.listen(3000, ()=>{
    console.log('Server is listening on port 3000');
})