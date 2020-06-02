const express = require('express');
const app = express(); 
const bodyParser = require('body-parser');
const mongoose = require('./db/mongoose');




//load middlewares
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));


//load in db modules
const { List, Task, User } = require('./db/models') 


//Route handlers

//sets CORS headers to the responses
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*"); // update * to match the domain you will make the request from
    res.header("Access-Control-Allow-Methods", "GET, POST, HEAD, PUT, PATCH, DELETE");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, , x-access-token, x-refresh-token, _id");
    
    res.header(
        'Access-Control-Expose-Headers',
        'x-access-token, x-refresh-token'
    )
    
    next();
  });

//Verify Refresh token middleware to verrify the session
let verifySession = (req, res, next) => {
    //grab the refersh token from the header
    let  refreshToken = req.header('x-refresh-token');

    //grab the _id from the request header
    let _id = req.header('_id');

    User.findByIdAndToken(_id, refreshToken).then((user) =>{
        if (!user){
            //user couldn't be found
            return Promise.reject({
                'error' : 'User not found. Make sure the refresh token and user id are valid'
            })
        }
        //user is found, session is valid, therefore refresh token exists in db
        req.user_id = user._id;
        req.userObject = user;
        req.refreshToken = refreshToken;

        let isSessionValid = false;

        user.sessions.forEach((session) =>{
            if (session.token === refreshToken){
                //check if the session has expired
                if (User.hasRefreshTokenExpired(session.expiresAt) === false){
                    //refresh token has not expired
                    isSessionValid = true;
                }
            }
        })

        if (isSessionValid){
            next(); //continues with web request
        } else{
            return Promise.reject({
                'error' : 'Refresh token has expired or invalid'
            })
        }
    }).catch((e) =>{
        res.status(401).send(e);
    })
}

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
        {$set: req.body}).then(()=>{
            res.send(200);
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
         res.send({});
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

//User routes
//POST /users = signup

app.post('/users', (req, res) =>{
    let body = req.body;
    let newUser = new User(body);

    newUser.save().then(() =>{
        return newUser.createSession();
    }).then((refreshToken) =>{
        //session created - refreshToken returned
        //generate an access token for user
        return newUser.generateAccessAuthToken().then((accessToken) =>{
            //access auth token generated successfully, now return an object containing the auth tokens
            return {accessToken, refreshToken} 
        })
    }).then((authToken) =>{
        //now we costruct and send the response to the user with their auth tokens in the header and the user object in the body
        res
            .header('x-refresh-token', authToken.refreshToken)
            .header('x-access-token', authToken.accessToken)
            .send(newUser);
    }).catch((e) =>{
        res.status(400).send(e);
    })
})

// POST /users/login = login
app.post('/users/login', (req, res) =>{
    let email = req.body.email;
    let password = req.body.password; 

    User.findByCredentials(email, password).then((user) =>{
        return user.createSession().then((refreshToken) =>{
        //session created - refreshToken returned
        //generate an access token for user
            return user.generateAccessAuthToken().then((accessToken) =>{
                //access auth token generated successfully, now return an object containing the auth tokens
                return {accessToken, refreshToken} 
        })
        }).then((authTokens) =>{
        //now we costruct and send the response to the user with their auth tokens in the header and the user object in the body
        
            res.header('x-refresh-token', authTokens.refreshToken)
            res.header('x-access-token', authTokens.accessToken)
            res.send(user);
        })
    }).catch((e) =>{
        res.status(400).send(e);
    })
})

//GET /users/me/access-token
//generates and returns an access token
app.get('/users/me/access-token', verifySession, (req, res) =>{
    //user is authenticated and user_id and user object is available
    req.userObject.generateAccessAuthToken().then((accessToken) =>{
        res.header('x-access-token', accessToken).send({ accessToken })
        //provides the client two ways to get the accessToken
    }).catch((e) =>{
        res.status(400).send(e);
    })
}) 

//starting a dev port
app.listen(3000, ()=>{
    console.log('Server is listening on port 3000');
})