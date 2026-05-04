if (getCookie("userid") == "" || getCookie("usersecret") == "") {
	window.location = "/login.html";
}

async function start() {
    try {
        await connection.start();
        console.log("Connected to server");
		var userInfo = await fetch("https://api.kiwiandoesthings.place/request_userInfo?userID=" + getCookie("userid"));
		var json = await userInfo.json();
		if (json == "-1") {
			window.location = "/login.html";
		}
		var nameDisplay = document.getElementById("username-display");
		nameDisplay.innerHTML = "Currently logged in as: <span style=\"color: #" + json.userColor + "\">" + json.userUsername + "</span>";
    } catch (error) {
        console.log("Error connecting: " + error);
    }
}

start();

function logout() {
	setCookie("userid", "");
	setCookie("usersecret", "");
	window.location = "/login.html";
}