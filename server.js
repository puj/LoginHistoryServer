var app = require('express').createServer();

app.post('/', function(req, res){
  console.log(req.params);
  res.send('Hello World');
});

app.listen(80);