const connection = new signalR.HubConnectionBuilder().withUrl("https://api.kiwiandoesthings.place/protocall").withAutomaticReconnect().build();

connection.on("push_serverMessage", (alertMessage) => {
	alert(alertMessage);
	shouldCancelMessageClear = true;
});

function setCookie(key, value) {
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + 365);
  document.cookie = `${key}=${value}; expires=${expiry.toUTCString()}; path=/`;
}

function getCookie(cookie) {
  const cookies = document.cookie.split("; ");
  for (let c of cookies) {
    const [key, value] = c.split("=");
    if (key === cookie) {
		return value;
	}
  }
  return "";
}

function colorMsg(message, color = "white") {
	return `<span style="color: ${color};">${message}</span>`;
}

async function getUserInfo(userID) {
	var userInfo = await fetch("https://api.kiwiandoesthings.place/request_userInfo?userID=" + userID);
	var json = await userInfo.json();
	if (json == "-1") {
		return {
			userUsername: "Unknown",
			userColor: "808080"
		};
	} else {
		return json;
	}
}

if (getCookie("knownrooms") == "") {
	setCookie("knownrooms", ".HomeRoom,0");
}