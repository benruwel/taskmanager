const express = require('express');
const app = express();

app.get("/", (req, res)=>{
    res.send('Hello world');
})

//starting a dev port
app.listen(3000, ()=>{
    console.log('Server is listening on port 3000');
})