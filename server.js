var express = require('express');
var app = express.createServer();
var jade = require('jade');
  
app.configure(function(){
    app.set('views', __dirname + '/views');
    app.set('view engine', 'jade');
    app.use(require('connect').bodyDecoder());
    app.use(express.methodOverride());
    app.use(app.router);
    app.use("/public", express.staticProvider(__dirname + '/public'));
});

	

app.get('/',function(req,res){
  	res.render('login', { }, function(err,data){
  		res.end(data);
  	});
	

});

app.post('/', function(req, res){
  req.accepts('application/json');
  console.log(req.body.username);
  console.log(req.body.password);
  res.send('Hello World');
});

app.listen(80);
