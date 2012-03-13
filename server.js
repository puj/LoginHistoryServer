var express = require('express');
var app = express.createServer();


app.use(require('connect').bodyDecoder());

app.post('/', function(req, res){
  req.accepts('application/json');
  console.log(req.body.username);
  console.log(req.body.password.toString("utf8"));
  res.send('Hello World');
});

app.listen(80);
