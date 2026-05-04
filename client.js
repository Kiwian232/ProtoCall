document.getElementById("warning").innerHTML = "WARNING: This version of ProtoCall is in testing. Beware of bugs and unfinished features";

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

var totalMessages = 0;
var canRequestMessages = true;

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

document.getElementById("chat-messages-area").addEventListener("wheel", function(event) {
	if (document.getElementById("chat-messages-area").scrollTop <= 5 && event.deltaY < 0) {
    	if (earliestMessageIndex > 1 && canRequestMessages) {
            connection.invoke("push_messageRequest", earliestMessageIndex, 20, parseInt(currentRoomID));
			canRequestMessages = false;
        }
    }
});

async function start() {
    try {
		clearLog();
        await connection.start();
        console.log("Connected to server");
		setConnected();
		await connectToRoomID("HomeRoom", 0);
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
	setRoomInfos(json);
	await connection.invoke("push_messageRequest", -1, 50, currentRoomID);
	if (getCookie("knownrooms").indexOf(roomName) == -1) {
		addRoomToList(roomName, currentRoomID);
	}
	systemLog("You have successfully connected to room \"" + colorMsg(roomName, "var(--server-alert-color)") + "\"");
}

async function connectToRoomID(roomName, roomID) {
	currentRoomID = roomID;
	var roomInfo = await fetch("https://api.kiwiandoesthings.place/request_roomInfo?roomName=" + roomName);
	var json = await roomInfo.json();
	if (json == -1) {
		alert("Failed to connect directly to room");
		return;
	}
	setRoomInfos(json);
	systemLog("You have successfully connected to room \"" + colorMsg(roomName, "var(--server-alert-color)") + "\"");
	await connection.invoke("push_messageRequest", -1, 50, parseInt(currentRoomID));
}

async function setRoomInfos(roomJson) {
	document.getElementById("room-name").innerHTML = roomJson.roomName;
	document.getElementById("room-status").innerHTML = "Public";
	document.getElementById("room-status").style.color = "var(--public-color)";

	var listItem = document.createElement("li");
	var userInfo = await getUserInfo(getCookie("userid"));
	listItem.innerHTML = userInfo.userUsername;
	listItem.style.color = "#" + userInfo.userColor;
	document.getElementById("connected-users").appendChild(listItem);
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
	canRequestMessages = true;

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

		var sendTime = message.messageTimestamp;

        if (!isHistory) {
            log(message.content, userInfo.userUsername, "#" + userInfo.userColor, sendTime, false);
            latestMessageIndex = Math.max(latestMessageIndex, message.messageIndex);
            if (earliestMessageIndex === -1 || message.messageIndex < earliestMessageIndex) {
                earliestMessageIndex = message.messageIndex;
            }
        } else {
            log(message.content, userInfo.userUsername, "#" + userInfo.userColor, sendTime, true);
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
	log(colorMsg(text, "var(--server-message-color)"), "&lt;System", "var(--server-message-color)", singleDate(), back);
}

function log(text, authorUsername, authorColor, timestamp, back = false) {
    var grid = document.getElementById("chat-container");

    var timeElement = document.createElement("div");
    timeElement.className = "timestamp";
    timeElement.innerText = timestamp;

    var msgElement = document.createElement("div");
    msgElement.className = "message";
    msgElement.innerHTML = "<span style=\"color: " + authorColor + ";\">" + authorUsername + "></span> " + text;

    if (back) {
        grid.prepend(timeElement);
        grid.prepend(msgElement);
    } else {
        grid.appendChild(msgElement);
        grid.appendChild(timeElement);

        var area = document.getElementById("chat-messages-area");
        area.scrollTop = area.scrollHeight;
    }
    totalMessages++;
}

function clearLog() {
	var log = document.getElementById("chat-container");
	log.innerHTML = "";
	totalMessages = 0;
	earliestMessageIndex = -1;
	latestMessageIndex = -1;
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
		clearLog();
        connectToRoomID(roomName, roomID);
    });
	link.textContent = roomName;
	listItem.appendChild(link);
	list.appendChild(listItem);
}

function getDatetime() {
	var now = new Date();

	var options = {
 	   	hour: '2-digit',
 	   	minute: '2-digit',
 	   	second: '2-digit',
	    day: '2-digit',
	    month: '2-digit',
	    year: 'numeric',
	    hour12: false
	};

	var formatter = new Intl.DateTimeFormat('en-GB', options);
	var parts = formatter.formatToParts(now);

	var datetime = Object.fromEntries(parts.map(p => [p.type, p.value]));

 	return formattedDate = `${datetime.hour}:${datetime.minute}:${datetime.second} ${datetime.month}/${datetime.day}/${datetime.year}`;
}

function singleDate() {
	var now = new Date();
    
    var hh = now.getHours();
    var min = now.getMinutes();
    var ss = now.getSeconds();
    var dd = now.getDate();
    var mm = now.getMonth() + 1;
    var yyyy = now.getFullYear();

    return `${hh}:${min}:${ss} ${mm}/${dd}/${yyyy}`;
}