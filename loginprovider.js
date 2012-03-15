var Db = require('mongodb').Db;
var Connection = require('mongodb').Connection;
var Server = require('mongodb').Server;
var BSON = require('mongodb').BSON;
var ObjectID = require('mongodb').ObjectID;

LoginProvider = function(host, port){
	this.db = new Db('LoginHistory',new Server(host,port, {auto_reconnect:true}, {}));
	this.db.open(function(){});
};

LoginProvider.prototype.getCollection = function(callback) {

	// We sure do like this database
	this.db.collection('users', function(error, article_collection) {
	  if( error ) callback(error);
	  else callback(null, article_collection);
	});
};

LoginProvider.prototype.getUserBySessionCookie = function(sessionCookie, callback){
	// Get the collection of users
	this.getCollection(function(err, user_collection){
		if(err){
			callback(err);	
		}else{

			// Attempt to find the user by username
			user_collection.find({'sessionCookie':parseInt(sessionCookie)}, function(err, cursor){

				// Grab the info from the cursor
				cursor.toArray(function(err, items) {
					if(err || !items || items.length == 0){

						// User does not exist
						callback('No user with this session');
					}else{

						// Session is active, return the associated user?
						callback(null,items[0]);
					}
				});
			});
		}
	});
}


LoginProvider.prototype.getUserByUsername = function(username, callback){
	// Get the collection of users
	this.getCollection(function(err, user_collection){
		if(err){
			callback(err);	
		}else{

			// Attempt to find the user by username
			user_collection.find({'username':username}, function(err, cursor){

				// This array should only have one element
				cursor.toArray(function(err, items) {
					if(err || !items || items.length == 0){

						// User does not exist
						callback('no user');
					}else{

						// User exists, return it
						callback(null,items[0]);
					}
				});
			});
		}
	});
}

LoginProvider.prototype.registerUser = function(username, hash, callback){
	var dbObj = {
		username: username,
		pwhash: hash,
		logins:[]
	};

	this.getCollection(function(err, user_collection){
		if(err){
			callback(err);	
		}else{
			user_collection.insert(dbObj, function(){
				callback(null,username);
			});
		}


	});
};

LoginProvider.prototype.save = function(data, callback){
	// Get the collection of users
	this.getCollection(function(err, user_collection){
		if(err){
			callback(err);	
		}else{

			// Save the user based on the userobject passed in as data
			user_collection.save(data, function(){
				callback(null,data);
			});
		}
	});
}

LoginProvider.prototype.addLogin = function(username,newLogin, callback){
	//Get the collection of users
	this.getCollection(function(err, user_collection){
		if(err){
			callback(err);	
		}else{

			// Update the user and push the login in the array
			user_collection.update({username: username}, {$push: {logins: newLogin}}, {safe:true}, function(err) {

				if(err){
					callback(err);
				}else{
					// Succesfully added the login
					callback(null);
				}
            });
		}
	});
};

LoginProvider.prototype.getLogins = function(username, callback){
	// The the user object by name
	this.getUserByUsername(username, function(err, data){

		if(err || !data || !data.logins){
			callback("Could not retrieve data for user : " + data.username);
		}else{
			// Return the logins array
			callback(null,data.logins)	
		}
		
	});
};

LoginProvider.prototype.getLoginsByCookie = function(cookie, callback){
	// Ensure the local scope
	var self = this;

	// Get the username from the cookie
	self.getUserBySessionCookie(cookie,function(err,data){
		if(!err && data && data.username){

			// Get the logins for the user
			self.getLogins(data.username,function(err,logins){

				if(!err){
					// Return the logins for the user
					callback(null,logins);
				}else{
					callback(err);
				}
			});
		}else{
			callback(err);
		}
	});
};


LoginProvider.prototype.isSessionAlive = function(sessionCookie, callback){

	// Get the user object based on the cookie
	this.getUserBySessionCookie(sessionCookie, function(err,data){		
		if(err || !data){
			callback("No session with this cookie active");
		}else{

			// This should actually verify the cookie based on the expiry date
			callback(null);
		}
	});
};

exports.LoginProvider = LoginProvider;