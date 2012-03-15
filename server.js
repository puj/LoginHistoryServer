var express = require('express');
var app = express.createServer();
var jade = require('jade');
var LoginProvider = require('./loginprovider').LoginProvider;
var loginProvider = new LoginProvider('localhost', 27017);

app.configure(function(){
    app.set('views', __dirname + '/views');
    app.set('view engine', 'jade');
    app.use(require('connect').bodyDecoder());
    app.use(express.methodOverride());
    app.use(app.router);
    app.use("/public", express.staticProvider(__dirname + '/public'));
});



app.get('/',function (req,res){
  res.redirect('register');
});

app.get('/login',function(req,res){
  	res.render('login', { }, function(err,data){
  		res.end(data);
  	});
});

app.get('/register',function(req,res){
    res.render('register', { }, function(err,data){
      res.end(data);
    });
});


app.post('/login', function (req,res){
  req.accepts('application/json');

  // Get the credentials from the request
  var username = req.body.username;
  var pwHash = req.body.pwHash;

  // Try to get the user in order to check the password
  loginProvider.getUserByUsername(username, function(err,data){
    if(err){
        res.send({result: 'failure', data : "Login Failure"});
    }else{
        // Found the user
        if(data.pwhash === pwHash && data.username === username){
          // User authenticated
          
          //Create a session cookie here
          var sessionCookie = Math.random()*9007199254740992;
          var timeoutMinutes = 30;
          
          // Need to save the new info here.
          loginProvider.save(data, function(err,data){
              if(err){
                console.log("Save unsuccesful for : " + username);
              }else{
                console.log("Succesfully updated information for : " + username);
              }
          });

          // Need to add the new login
          var newLogin = (new Date().getTime());
          loginProvider.addLogin(username,newLogin, function(err,data){
            if(err){
              console.log("Could not add new login record for : " + username);
            }else{
              console.log("Succesfully added new login for  : " + username);
            }
          });

          // Give the session cookie back to the client
          res.cookie('LoginHistoryCookie', sessionCookie, { maxAge: timeoutMinutes, path: '/login'});
          res.send({result: 'success', sessionCookie : sessionCookie});
        }else{
          res.send({result: 'failure', data : "Login Failure"});
        }
    }
  });

});

app.post('/register',function(req, res){
	req.accepts('application/json');

  // Get the credentials from the request
  var username = req.body.username;
  var pwHash = req.body.pwHash;

  // First check if the user already exists
  loginProvider.getUserByUsername(username, function(err,data){
    if(err){
      // This user does not already exist
      // Create the user in the DB instance
      loginProvider.registerUser(username,pwHash, function(err, data){
        if(err){
          res.send({result: 'failure', data : "DB error"});
        }else{
          res.send({result: 'success', data : data});  
        }
      });  
    }else{
      // Use already exists, cannot create.
      res.send({result : 'failure', data : "User already exists"})
    }
  });
});	

app.post('/', function(req, res){
  req.accepts('application/json');
  console.log(req.body.username);
  console.log(req.body.password);
  res.send('Hello World');
});

app.listen(80);
