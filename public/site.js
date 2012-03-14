// Returns the SHA512 hash from the str
function getSHA512(str){
	var shaObj = new jsSHA(str, "ASCII");
	var hash = shaObj.getHash("SHA-512", "HEX");
	return hash;
}

// Uses the user input credentials to register the user
function login(){
	// Create password hash input from username, password, and salt
	var username = document.getElementById('txtUsername').value;
	var password = document.getElementById('txtPassword').value;
	var salt = '09234j234kj!@#213lk$#$)(*)DFSDFL##$';
	var passwordAndSalt = username + password + salt;

	// Get a SHA512 hash from the credentials
	var hash = getSHA512(passwordAndSalt);
	
	// Create a simple JSON object to post
	var userObj = {
		username : username,
		pwHash : passwordAndSalt,
	}

	// Post the registration event to the server
	$.post("/register", userObj,
	  function(data){
	  	alert("post success");
	  }
	);
}