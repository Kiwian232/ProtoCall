var timeoutDuration = 0;
var timingOut = false;

setInterval(function() {
	if (timingOut) {
		timeoutDuration -= 100;
		if (timeoutDuration == 0) {
			alert("You disconnected from the server! Please try reloading the page. If you still do not connect, the server may be down.");
		}
	}
}, 100);

socket.on("connect", () => {
	console.log("Connected!");
	timeoutDuration = 0;
	timingOut = false;
});

socket.on("user_idreturn", (userID) => {
	console.log("UserID returned: " + userID);
	setCookie("userid", userID);
	window.location.replace('/index.html');
});

function register() {
	var username = document.getElementById("username").value;
	var email = document.getElementById("email").value;
	var password = document.getElementById("password").value;
	console.log(username, email, password)
	socket.emit("user_register", username, "black", email, password);
}

function login() {
	var email = document.getElementById("email").value;
	var password = document.getElementById("password").value;
	getUserID(email, password);
}

function getUserID(email, password) {
	return socket.emit("user_idrequest", email, password);
}