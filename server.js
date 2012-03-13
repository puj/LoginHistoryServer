var express = require('express');
var app = express.createServer();


app.use(require('connect').bodyDecoder());

app.post('/', function(req, res){
  req.accepts('application/json');
  console.log(req.body);
  res.send('Hello World');
});

app.listen(80);