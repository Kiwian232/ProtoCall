async function loadClient() {
	if (getCookie("userid") == "" || getCookie("usersecret") == "") {
		window.location = "/login.html";
	} else {
		var info = await getUserInfo(getCookie("userid"));
		var username = await info.userUsername;
		var color = await info.userColor;
		document.getElementById("username-view").innerHTML = username;
		document.getElementById("username-view").style.color = "#" + color;
	}
}

loadClient();

var lostConnection = false;
var connected = false;

var shouldCancelMessageClear = false;

var latestMessageIndex = -1;
var earliestMessageIndex = -1;

var userInfos = {};

var currentRoomID = 0;

var knownRooms = getCookie("knownrooms").split(".");
for (var room in knownRooms) {
	if (room == 0) {
		continue;
	}
	var parts = knownRooms[room].split(",");
	addVisualRoom(parts[0], parts[1]);
}

document.getElementById("chat-input").addEventListener("keydown", function(event) {
	if (event.key === "Enter") {
		send();
		event.preventDefault();
	}
});

document.getElementById("log").addEventListener("wheel", function(event) {
	if (document.getElementById("log").scrollTop <= 5 && event.deltaY < 0) {
    	if (earliestMessageIndex > 1) {
            connection.invoke("push_messageRequest", earliestMessageIndex, 20, currentRoomID);
        }
    }
});

async function start() {
    try {
        await connection.start();
		setConnected();
        console.log("Connected to server");
		connectToRoomID("HomeRoom", 0);
    } catch (error) {
        console.log("Error connecting: " + error);
    }
}

start();

async function connectToRoom() {
	var roomName = document.getElementById("room-select-input").value;
	var roomInfo = await fetch("https://api.kiwiandoesthings.place/request_roomInfo?roomName=" + roomName);
	var json = await roomInfo.json();
	if (json == -1) {
		if (confirm("That room does not exist! Create it?")) {
			connection.invoke("push_createRoom", roomName, getCookie("userid"), getCookie("usersecret"));
		}
		return;
	}
	clearLog();
	currentRoomID = json.roomID;
	document.getElementById("room-name").innerHTML = json.roomName;
	await connection.invoke("push_messageRequest", -1, 50, currentRoomID);
	if (getCookie("knownrooms").indexOf(roomName) == -1) {
		addRoomToList(roomName, currentRoomID);
	}
	systemLog("You have successfully connected to room \"" + colorMsg(roomName, "red") + "\"");
}

async function connectToRoomID(roomName, roomID) {
	clearLog();
	currentRoomID = roomID;
	document.getElementById("room-name").innerHTML = roomName;
	await connection.invoke("push_messageRequest", -1, 50, parseInt(currentRoomID));
	systemLog("You have successfully connected to room \"" + colorMsg(roomName, "red") + "\"");
}

connection.onclose(error => {
	systemLog("You have disconnected from the server!");
	lostConnection = true;
});

connection.onreconnected(connectionID => {
	setConnected();
});

connection.on("push_recieveRoom", async (roomName, roomID) => {
	clearLog();
	currentRoomID = roomID;
	await connection.invoke("push_messageRequest", -1, 50, currentRoomID);
	document.getElementById("room-name").innerHTML = roomName;
	addRoomToList(roomName, currentRoomID);
});

connection.on("push_recieveMessages", async (messages) => {
	var fetchPromises = messages.map(message => {
        if (userInfos[message.authorID] === undefined) {
            userInfos[message.authorID] = fetch("https://api.kiwiandoesthings.place/request_userInfo?userID=" + message.authorID).then(result => result.json()).catch(() => ({ userUsername: "Unknown", userColor: "808080" }));
        }
        return userInfos[message.authorID];
    });
	
	await Promise.all(fetchPromises);

	var isHistory = earliestMessageIndex !== -1 && messages[0].messageIndex < earliestMessageIndex;

    if (isHistory) {
        messages.reverse();
    }

	for (var message of messages) {
        var userInfo = await userInfos[message.authorID];

        if (message.messageIndex === earliestMessageIndex && isHistory) {
			continue;
		}

        if (!isHistory) {
            log(message.content, userInfo.userUsername, userInfo.userColor, false);
            latestMessageIndex = Math.max(latestMessageIndex, message.messageIndex);
            if (earliestMessageIndex === -1 || message.messageIndex < earliestMessageIndex) {
                earliestMessageIndex = message.messageIndex;
            }
        } else {
            log(message.content, userInfo.userUsername, userInfo.userColor, true);
            earliestMessageIndex = message.messageIndex;
        }
    };
});

async function send() {
	var input = document.getElementById("chat-input");
	if (input.value == "") {
		return;
	}
	if (connected && currentRoomID != -1) {
		await connection.invoke("push_sendMessage", getCookie("userid"), getCookie("usersecret"), input.value, parseInt(currentRoomID));
		if (shouldCancelMessageClear) {
			shouldCancelMessageClear = false;
			return;
		}
		input.value = "";
	} else {
		if (currentRoomID != -1) {
			systemLog("You cannot send messages while not connected!");
		} else {
			systemLog("You cannot send messages while not in a room!");
		}
	}
}

function setConnected() {
	if (connected) {
		systemLog("You have successfully reconnected to the server!");
		lostConnection = false;
	} else {
		systemLog("You have successfully connected to the server!");
	}
	connected = true;
}

function systemLog(text, back = false) {
	log(colorMsg(text, "lightblue"), "&lt;System", "add8e6", back);
}

function log(text, authorUsername, authorColor, back = false) {
	var log = document.getElementById("log");
	var messageText = "<span><span style=\"color: #" + authorColor + ";\">" + authorUsername + "></span> " + text + "</span>"
	if (back) {
		var prevScrollHeight = log.scrollHeight;
		var prevScrollTop = log.scrollTop;

		log.innerHTML = log.innerHTML + messageText;

		var newScrollHeight = log.scrollHeight;
		log.scrollTop = prevScrollTop + (newScrollHeight - prevScrollHeight);
	} else {
		log.innerHTML = messageText + log.innerHTML;
		//log.scrollTop = log.scrollHeight;
	}
}

function clearLog() {
	var log = document.getElementById("log");
	log.innerHTML = "";
}

function addRoomToList(roomName, roomID) {
	setCookie("knownrooms", getCookie("knownrooms") + "." + roomName + "," + roomID);
	addVisualRoom(roomName, roomID);
}

function addVisualRoom(roomName, roomID) {
	var list = document.getElementById("known-room-list");
	var listItem = document.createElement("li");
	var link = document.createElement("a");
	link.href = "javascript:void(0)";
	link.addEventListener("click", function(event) {
        event.preventDefault();
        connectToRoomID(roomName, roomID);
    });
	link.textContent = roomName;
	listItem.appendChild(link);
	list.appendChild(listItem);
}