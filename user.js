var colorLabel = document.getElementById("colorlabel");
var colorPicker = document.getElementById("color");
if (colorLabel != null) {
	setInterval(function() {
		colorLabel.style.color = colorPicker.value;
	}, 10);
}


async function start() {
    try {
        await connection.start();
        console.log("Connected to server");
		timeoutDuration = 0;
		timingOut = false;
    } catch (error) {
        console.log("Error connecting: " + error);
    }
}

start();

async function register() {
	var username = document.getElementById("username").value;
	var color = document.getElementById("color").value.slice(1);
	var password = document.getElementById("password").value;

	var loginInfo = await fetch("https://api.kiwiandoesthings.place/request_registerAccount?username=" + username + "&password=" + password + "&color=" + color);
	var json = await loginInfo.json();
	var userID = json.userID;
	var userSecret = json.userSecret;
	console.log(loginInfo);
	if (json  == "-1") {
		alert("Account is either already registered or provided registration info is invalid");
		return;
	}
	console.log("UserID returned: " + userID);
	console.log("UserSecret returned: " + userSecret);
	setLoginInfo(userID, userSecret);
	window.location.replace('/index.html');
}

async function login() {
	var username = document.getElementById("username").value;
	var password = document.getElementById("password").value;

	var loginInfo = await fetch("https://api.kiwiandoesthings.place/request_loginInfo?username=" + username + "&password=" + password);
	var json = await loginInfo.json();
	var userID = json.userID;
	var userSecret = json.userSecret;
	if (json == "-1") {
		alert("Login is invalid");
		return;
	}
	console.log("UserID returned: " + userID);
	console.log("UserSecret returned: " + userSecret);
	setLoginInfo(userID, userSecret);
	window.location.replace('/index.html');
}

function setLoginInfo(userID, userSecret) {
	setCookie("userid", userID);
	setCookie("usersecret", userSecret);
}