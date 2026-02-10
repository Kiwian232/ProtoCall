var pingTime = 5000;
var connected = false;
var lostConnection = false;

var earliesMessageIndex = 0;

setInterval(function() {
	pingTime -= 100;
	if (pingTime < 2500) {
		pingServer();
	}
	if (pingTime === 0) {
		console.log("Server has not returned ping in 5000ms!");
		log("You have lost connection to the server; it may have gone offline or crashed.");
		connected = false;
		lostConnection = true;
	}
	document.getElementById("debug").innerHTML = "PingTime: " + (pingTime / 100) + ", EarliestMessageIndex: " + earliesMessageIndex;
}, 100);

socket.on("connect", () => {
	if (lostConnection) {
		log("You have successfully reconnected to the server!");
		lostConnection = false;
	} else {
		log("You have successfully connected to the server!");
	}
	connected = true;
});

socket.on("disconnecct", () => {
	log("You have disconnected from the server!");
})

socket.on("message_server", (data, messageIndex) => {
    log(data);
	console.log("Recieved server message: \"" + data + "\"");
	if (messageIndex < earliesMessageIndex) {
		earliesMessageIndex = messageIndex;
	}
});

socket.on("ping_back", () => {
	pingTime = 5000;
});

function send() {
	if (connected) {
		const msg = document.getElementById("msg").value;
		socket.emit("message_client", msg, getUserID());
	} else {
		log("You cannot send messages while not connected!");
	}
}

function pingServer() {
	socket.emit("ping_forward", getUserID());
	console.log("pinged!");
}

function log(text) {
	document.getElementById("log").innerHTML += text + "\n";
}

function getUserID() {
	return getCookie("userid");
}