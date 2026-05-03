var lostConnection = false;
var connected = false;

var earliestMessageIndex = -1;
var expectedOldestMessage = -1;

document.getElementById("msg").addEventListener("keydown", function(event) {
	if (event.key === "Enter") {
		send();
		event.preventDefault();
	}
});

document.getElementById("log").addEventListener("wheel", function(event) {
	if (document.getElementById("log").scrollTop == 0 && event.deltaY < 0) {
    	if (earliestMessageIndex > 1) {
            connection.invoke("push_messageRequest", earliestMessageIndex, 20);
        }
    }
});

async function start() {
    try {
        await connection.start();
		await connection.invoke("push_messageRequest", -1, 50);
        console.log("Connected to server");
		timeoutDuration = 0;
		timingOut = false;
		
		setConnected();
    } catch (error) {
        console.log("Error connecting: " + error);
    }
}

start();

connection.onclose(error => {
	log(colorMsg("You have disconnected from the server!", "lightblue"));
	lostConnection = true;
});

connection.onreconnected(connectionID => {
	setConnected();
});

connection.on("push_recieveMessage", (userID, message, messageIndex) => {
	console.log("Recieved server message: \"" + message + "\"");
	console.log(messageIndex)
	if (messageIndex == expectedOldestMessage) {
		expectedOldestMessage = -1;
	}
	if (messageIndex < earliestMessageIndex) {
		log(message, true);
	} else {
		log(message);
	}

	if (messageIndex < earliestMessageIndex || earliestMessageIndex == -1) {
		earliestMessageIndex = messageIndex;
	}
});

async function send() {
	const input = document.getElementById("msg");
	if (input.value == "") {
		return;
	}
	if (connected) {
		await connection.invoke("push_sendMessage", getCookie("userid"), getCookie("usersecret"), input.value);
		input.value = "";
	} else {
		log(colorMsg("You cannot send messages while not connected!", "lightblue"));
	}
}

function setConnected() {
	if (connected) {
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