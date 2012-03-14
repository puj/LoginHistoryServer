function getSHA512(str){
	var shaObj = new jsSHA(str, "ASCII");
	var hash = shaObj.getHash("SHA-512", "HEX");
	return hash;
}

function login(){
	var username = document.getElementById('txtUsername').value;
	var password = document.getElementById('txtPassword').value;
	var salt = '09234j234kj!@#213lk$#$)(*)DFSDFL##$';
	var passwordAndSalt = username + password + salt;


	var hash = getSHA512(passwordAndSalt);
	alert(username + " : " + hash);
}