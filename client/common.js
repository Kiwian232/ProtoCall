const socket = io();

socket.on("alert_server", (alertMessage) => {
	alert(alertMessage);
});

socket.on("userinfo_response", (username, color) => {
	document.getElementById("userInfo").style.color = "#" + color;
	document.getElementById("userInfo").innerHTML = "Logged in as: " + username;
});

function setCookie(cookie, key) {
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + 365);
  document.cookie = `${cookie}=${key}; expires=${expiry.toUTCString()}; path=/`;
}

function getCookie(cookie) {
  const cookies = document.cookie.split("; ");
  for (let c of cookies) {
    const [key, value] = c.split("=");
    if (key === cookie) {
		return value;
	}
  }
  return null;
}

function colorMsg(message, color = "white") {
	return `<span style="color: ${color};">${message}</span>`;
}