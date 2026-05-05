async function loadClient() {
	if (getCookie("userid") == "" || getCookie("usersecret") == "") {
		window.location = "/login.html";
	} else {
		var userInfo = await getUserInfo();

		var roomSelect = document.getElementById("known-room-select-input");
		roomSelect.placeholder = userInfo.userUsername + "'s room"; 
		roomSelect = document.getElementById("new-room-select-input");
		roomSelect.placeholder = "Other user's room"; 
	}
}

loadClient();

async function start() {
    try {
        await connection.start();
        console.log("Connected to server");
    } catch (error) {
        console.log("Error connecting: " + error);
    }
}

start();

var roomSelectInput = document.getElementById("new-room-select-input");
var createButton = document.getElementById("room-create-button");
createButton.addEventListener("click", () => {
	var roomName = roomSelectInput.value;
	if (confirm("Are you sure you want to create room \"" + roomName + "\"")) {
		connection.invoke("push_createRoom", roomName, getCookie("userid"), getCookie("usersecret"));
		roomSelectInput.value = "";
	}
});

var searchButton = document.getElementById("room-search-button");
var newResults = document.getElementById("new-room-search-results");
searchButton.addEventListener("click", async () => {
	var roomInfo = await getRoomInfo(roomSelectInput.value);
	if (roomInfo == "-1") {
		newResults.innerHTML = "No room was found";
		return;
	} else {
		newResults.innerHTML = "Room found: <a href=\"chat.html?connectToRoom=" + roomInfo.roomName + "\"&co>" + roomInfo.roomName + "</a>";
	}
});