const connection = new signalR.HubConnectionBuilder().withUrl("https://localhost:7164/protocall").withAutomaticReconnect().build();

connection.on("alert_server", (alertMessage) => {
	alert(alertMessage);
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
  return null;
}

function colorMsg(message, color = "white") {
	return `<span style="color: ${color};">${message}</span>`;
}