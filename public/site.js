// Returns the SHA512 hash from the str
function getSHA512(str){
	var shaObj = new jsSHA(str, "ASCII");
	var hash = shaObj.getHash("SHA-512", "HEX");
	return hash;
}

function getHash(username,password){
	var salt = '09234j234kj!@#213lk$#$)(*)DFSDFL##$';
	var passwordAndSalt = username + password + salt;

	// Get a SHA512 hash from the credentials
	return getSHA512(passwordAndSalt);
}

// Uses the user input credentials to register the user
function register(){
	// Create password hash input from username, password, and salt
	var username = document.getElementById('txtUsername').value;
	var password = document.getElementById('txtPassword').value;
	var passwordAndSalt = getHash(username,password);
	
	
	// Create a simple JSON object to post
	var userObj = {
		username : username,
		pwHash : passwordAndSalt,
	}

	// Post the registration event to the server
	$.post("/register", userObj,
	  function(data){
	  	if(data.result == "success"){	
	  		alert("Congratulations, " + username +", you are now registered");
	  		window.location.href = '/login';
	  	}else{
	  		alert("Sorry, that " + username + " is not available");
	  	}
	  }
	);
}

function login(){
	// Create password hash input from username, password, and salt
	var username = document.getElementById('txtUsername').value;
	var password = document.getElementById('txtPassword').value;
	var passwordAndSalt = getHash(username,password);

	// Create a simple JSON object to post
	var userObj = {
		username : username,
		pwHash : passwordAndSalt,
	}

	// Post the registration event to the server
	$.post("/login", userObj,
	  function(data){
	  	if(data.result == "success"){
	  		// User succesfully logged in
	  		alert(data.sessionCookie);
	  	}else{
	  		// Login failed
	  		alert("Login failure.");
	  	}
	  }
	);


}