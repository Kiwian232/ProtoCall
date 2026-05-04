if (getCookie("userid") == "" || getCookie("usersecret") == "") {
	window.location = "/login.html";
}

var knownRooms = getCookie("knownrooms").split(".");
for (var room in knownRooms) {
	if (room == 0) {
		continue;
	}
	var parts = knownRooms[room].split(",");
	//addVisualRoom(parts[0], parts[1]);
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

function addVisualRoom(roomName, roomID) {
	var list = document.getElementById("known-room-list");
	var listItem = document.createElement("li");
	var link = document.createElement("a");
	var buttonDelete = document.createElement("button");
	//buttonDelete
	link.href = "javascript:void(0)";
	link.addEventListener("click", function(event) {
        event.preventDefault();
        connectToRoomID(roomName, roomID);
    });
	link.textContent = roomName;
	listItem.appendChild(link);
	list.appendChild(listItem);
}

function resetKnownRooms() {
	setCookie("knownrooms", ".HomeRoom,0");
}