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


/***********/
/** INTERNAL FUNCTIONS */
/***********/

/**
 * Get the cookie from the request, if it exists.
 *  callback is called with null if no cookie is found
 */
function _getCookie(request, callback){
  // Keep track if we find the cookie or not
  var foundCookie = false;

  if(request.headers.cookie){

    // Look through all of the cookies and find ours
    request.headers.cookie.split(';').forEach(function( cookie ) {

      // Split each cookie into key-values
      var parts = cookie.split('=');

      // This is our cookie!
      if(parts[0].trim() == "LoginHistoryCookie"){

        // Me can haz cookie?! \o.0/
        foundCookie = true;
        callback(parts[1]);
        return;
      } 
    });
  }

  // This request does not have a cookie from us
  if(!foundCookie){
    callback(null);
  }
};


/**
 * If the user is logged in, but tries to go to login or another
 *  page which is useless for authenticated users, redirect to
 *  the loggedin page
 */
function _redirectIfLoggedIn(request, response, callback){

  // Find our cookie
  _getCookie(request,function(cookieFound){
    if(!cookieFound){

      // No active session
      callback();
    }else{

      // A cookie was found, but is it active?
      loginProvider.isSessionAlive(cookieFound, function(err,data){
        if(err){

          // Continue about your business
          callback();
        }else{

          // A valid cookie, send the user home
          response.statusCode = 302;
          response.setHeader("Location", "/loggedin");
          response.end();
        }
      });
    }
  });
}

/**
 * If the user is logged out, and trying to access a page which
 *  requires authentication, redirect to login.
 */
function _redirectIfLoggedOut(request, response, callback){

  // Find our cookie
  _getCookie(request,function(cookieFound){
    if(cookieFound){

      // No active session
      callback();
    }else{

      // A cookie was found, but is it active?
      loginProvider.isSessionAlive(cookieFound, function(err,data){
        if(!err){

          // You don't have a cookie, you are suppposed to be here
          callback();
        }else{

          // A valid cookie, send the user home
          response.statusCode = 302;
          response.setHeader("Location", "/login");
          response.end();
        }
      });
    }
  });
}

/***********/
/** GET REQUEST HANDLERS */
/***********/

/**
 * I don't want an icon.
 */
app.get('/favicon.ico', function(req,res){
  res.writeHead(200, {'Content-Type': 'image/x-icon'} );
  res.end();
});

/**
 * Navigating to the root page redirects to register 
 * Authenticated users end up on loggedin
 */ 
app.get('/',function (req,res){
  res.redirect('register');
});

/**
 * This shows the login page for the user,
 *  if the user is already logged in, they are redirected to the loggedin page
 */
app.get('/login',function(req,res){
  _redirectIfLoggedIn(req,res,function(){

    // Session is not active, continue showing login page
    res.render('login', { }, function(err,data){
      res.end(data);
    });  
  });
});

/**
 * This shows the registration page for users not already authenticated
 *  If the user is authenticated, they are redirected to the loggedin page
 */ 
app.get('/register',function(req,res){

  // Make the user isn't already logged in (this is optional I guess)
  _redirectIfLoggedIn(req,res,function(){

    // Session is not active, continue showing registration page
    res.render('register', { }, function(err,data){
      res.end(data);
    });
  });
});

app.get('/loggedin', function(req, res){
  // Check if the user is authenticated to be here
  _redirectIfLoggedOut(req,res,function(){

    // Get the user's cookie
    _getCookie(req,function(data){

      // Get the user object from the session cookie
      loginProvider.getUserBySessionCookie(data,function(err,userObj){

        // Render the page for the user 
        res.render('loggedin', {"username":userObj.username, "logins" : userObj.logins}, function(err,responseData){
          if(err){
            res.end();
          }else{
            res.end(responseData);  
          }
        }); 
      });
    });
  });
});


/***********/
/** POST REQUEST HANDLERS */
/***********/

/**
 * This is the main method for authenticating. 
 *  This should be used on the Android app as well
 *  as via AJAX from the client
 * The response contains the newly created session cookie
 */
app.post('/login', function (req,res){
  req.accepts('application/json');

  // Get the credentials from the request
  var username = req.body.username;
  var pwHash = req.body.pwHash;

  // Try to get the user in order to check the password
  loginProvider.getUserByUsername(username, function(err,data){
    if(err){

      // This user doesn't exist, but don't tell the user (-;
      res.send({result: 'failure', data : "Login Failure"});
    }else{

        // Found the user
        if(data.pwhash === pwHash && data.username === username){
          // User authenticated
          
          //Create a session cookie here, super secure ....
          var sessionCookie = Math.random()*9007199254740992;
          var timeoutMinutes = 30;

          // Attach the sessioncookie to the user
          data.sessionCookie = sessionCookie;

          // Need to save the new info here.
          loginProvider.save(data, function(err,data){
              if(err){
                console.log("Cookie save unsuccessful for : " + username);
              }else{
                console.log("Cookie saved succesfully for : " + username);
              }
          });

          // Create the new timestamp
          var newLogin = (new Date().getTime());

          // Save the new login to the database
          loginProvider.addLogin(username,newLogin, function(err,data){
            if(err){
              console.log("Could not add new login record for : " + username);
            }else{
              console.log("Succesfully added new login for  : " + username);
            }
          });

          // Set the site-wide cookie in the browser
          res.cookie('LoginHistoryCookie', sessionCookie, { maxAge: timeoutMinutes, path: '/'});

          // Send the cookie back in JSON response as well
          res.send({result: 'success', sessionCookie : sessionCookie});
        }else{

          // This was a password mismatch
          res.send({result: 'failure', data : "Login Failure"});
        }
    }
  });

});


/**
 * This will register a new user without much verification
 *  I don't have an SMTP server laying around.
 */ 
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

/**
 * Clear the cookie from the browser and the database
 */
app.post('/logout', function(req,res){
  req.accepts('application/json');

  _getCookie(req,function(data){
    if(data){

      // We had a cookie, invalidate in headers
      res.cookie('LoginHistoryCookie', '', { maxAge: -1, path: '/'});

      // Remove from DB
    }

    // What we return here shouldn't matter
    res.send(data);
  });

});

app.listen(80);
