var pingTime = 5000;
var connected = false;
var lostConnection = false;

var earliestMessageIndex = -1;

document.getElementById("msg").addEventListener("keydown", function(event) {
	if (event.key === "Enter") {
		send();
		event.preventDefault();
	}
});

document.getElementById("log").addEventListener("wheel", function(event) {
	if (document.getElementById("log").scrollTop == 0 && event.deltaY < 0) {
		var loadAmt = 10;
		for (var i = 1; i < 1 + loadAmt; i++) {
			if (earliestMessageIndex - i < 1) {
				break;
			}
			socket.emit("message_request", earliestMessageIndex - i);
		}
	}
});

setInterval(function() {
	pingTime -= 100;
	if (pingTime < 2500) {
		pingServer();
	}
	if (pingTime === 0) {
		console.log("Server has not returned ping in 5000ms!");
		log(colorMsg("You have lost connection to the server; it may have gone offline or crashed.", "lightblue"));
		connected = false;
		lostConnection = true;
	}
	document.getElementById("debug").innerHTML = "PingTime: " + (pingTime / 100) + ", EarliestMessageIndex: " + earliestMessageIndex;
}, 100);

socket.on("connect", () => {
	setConnected();
});

socket.on("disconnecct", () => {
	log(colorMsg("You have disconnected from the server!", "lightblue"));
})

socket.on("message_server", (data, messageIndex) => {
	//console.log("Recieved server message: \"" + data + "\"");
	//console.log(messageIndex)
	if (messageIndex < earliestMessageIndex) {
		log(data, true);
	} else {
		log(data);
	}

	if (messageIndex < earliestMessageIndex || earliestMessageIndex == -1) {
		earliestMessageIndex = messageIndex;
	}
});

socket.on("ping_back", () => {
	pingTime = 5000;
	if (!connected) {
		setConnected();
	}
});

function send() {
	const input = document.getElementById("msg");
	if (input.value == "") {
		return;
	}
	if (connected) {
		socket.emit("message_client", input.value, getUserID());
		input.value = "";
	} else {
		log(colorMsg("You cannot send messages while not connected!", "lightblue"));
	}
}

function pingServer() {
	socket.emit("ping_forward", getUserID());
	console.log("pinged!");
}

function setConnected() {
	if (lostConnection) {
		log(colorMsg("You have successfully reconnected to the server!", "lightblue"));
		lostConnection = false;
	} else {
		log(colorMsg("You have successfully connected to the server!", "lightblue"));
	}
	connected = true;
}

function log(text, back = false) {
	const log = document.getElementById("log");
	if (back) {
		const prevScrollHeight = log.scrollHeight;
		const prevScrollTop = log.scrollTop;

		log.innerHTML = text + "\n" + log.innerHTML;

		const newScrollHeight = log.scrollHeight;
		log.scrollTop = prevScrollTop + (newScrollHeight - prevScrollHeight);
	} else {
		log.innerHTML += text + "\n";
		log.scrollTop = log.scrollHeight;
	}
}

function getUserID() {
	return getCookie("userid");
}