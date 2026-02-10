import express from "express";
import http from "http";
import { Server } from "socket.io";
import db from "./database.js";

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("client"));

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  socket.on("message_client", (message, userID) => {
    //console.log("Packet message_client: \"" + message + "\", From: \"" + author + "\"");

	const userRow = db.prepare("SELECT username, color FROM users WHERE userid = ?").get(userID);
	var userName = "";
	var userColor = "";
	if (userRow) {
		userName = userRow.username;
		userColor = userRow.color;
	} else {
		socket.emit("message_server", colorMsg("You cannot send messages because your login is not valid! (you are likely logged out)", "lightblue"));
		console.warn("WARN: Invalid message from userID: " + userID + " with content: \"" + message + "\"!");
		return;
	}

    var messageRow = db.prepare("INSERT INTO messages (content, author) VALUES (?, ?)").run(message, userID);

    io.emit("message_server", colorMsg(userName + ": ", "#" + userColor) + colorMsg(message), messageRow.lastInsertRowid);
  });

  socket.on("message_request", (messageID) => {
	const messageRow = db.prepare("SELECT content, author FROM messages WHERE id = ?").get(messageID);
	if (!messageRow) {
		socket.emit("message_server", colorMsg("Could not load requested message!"), -1);
	} else {
		const userRow = db.prepare("SELECT username, color FROM users WHERE userid = ?").get(messageRow.author);
		var userName = "[DeletedUser]";
		var userColor = "white";
		if (userRow) {
			userName = userRow.username;
			userColor = userRow.color;
		}
		socket.emit("message_server", colorMsg(userName + ": ", "#" + userColor) + colorMsg(messageRow.content), messageID);
		if (messageID == 1) {
			socket.emit("message_server", colorMsg("You have reached the end of chat history!", "lightblue"), 0);
		}
	}
  });

  socket.on("ping_forward", (author) => {
	//console.log("Packet ping_forward, From: " + author);
	socket.emit("ping_back");
  })

  socket.on("disconnect", () => {
	console.log("Packet disconnect, SocketID: " + socket.id);
    console.log("Client disconnected: " + socket.id);
  });

  socket.on("user_register", (name, color, email, password) => {
	console.log("Packet user_register, Name: \"" + name + "\", Color: \"" + color + "\", Email: \"" + email + "\", Password: \"" + password + "\"");

	const emailTaken = db.prepare("SELECT * FROM users WHERE email = ? OR username = ?").get(email, name);
	if (emailTaken) {
		socket.emit("alert_server", "This email or username is already registered!");
		return;
	}

	db.prepare(
      "INSERT INTO users (userid, username, color, email, password) VALUES (?, ?, ?, ?, ?)"
    ).run(generateUserID(), name, color, email, password);
  });

  socket.on("user_idrequest", (email, password) => {
	console.log("Packet user_idrequest, Email: \"" + email + "\", Password: \"" + password + "\"");

	const row = db.prepare("SELECT userid FROM users WHERE email = ? AND password = ?").get(email, password);

	if (row) {
		socket.emit("user_idreturn", row.userid);
	} else {
		socket.emit("alert_server", "Could not find user with entered email and password!");
	}
  });
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});


function generateUserID(length = 8) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function colorMsg(message, color = "white") {
	return `<span style="color: ${color};">${message}</span>`;
}