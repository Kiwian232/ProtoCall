var knownSelectInput = document.getElementById("known-room-select-input");
var newSelectInput = document.getElementById("new-room-select-input");

async function loadClient() {
	if (getCookie("userid") == "" || getCookie("usersecret") == "") {
		window.location = "/login.html";
	} else {
		var userInfo = await getUserInfo();

		knownSelectInput.placeholder = userInfo.userUsername + "'s room"; 
		newSelectInput.placeholder = "Other user's room";
	}
}

var searchOptions = {
  includeScore: true,
  threshold: 0.3
};

function updateSearchRooms(target, searchItems, elementName) {
	var roomNames = [];
	var roomIDs = [];
	for (var i = 0; i < searchItems.length; i++) {
        var parts = searchItems[i].split(",");
        roomNames.push(parts[0]);
        roomIDs.push(parts[1]);
    }
    
    var fuse = new Fuse(roomNames, searchOptions);
    var results = fuse.search(target);

    clearList(elementName);

    for (var i = 0; i < results.length; i++) {
        var match = results[i];
        var originalIndex = match.refIndex; 
        
        addVisualRoom(match.item, roomIDs[originalIndex], elementName);
    }
}

function addVisualRoom(roomName, roomID, elementName) {
	var parent = document.getElementById(elementName);
	var list = parent.querySelector("ul");
	var listItem = document.createElement("li");
	listItem.innerHTML = `
	<div class="search-result-item">
		<a class="result-label" href="/chat.html?connectToRoom=` + roomName + `">` + roomName + `</a>
		<div class="result-actions">
			<a href="javascript:void(0)" onclick="removeRoom(` + roomName + `,` + roomID + `)">
				<img src="resources/delete.png" class="icon-small">
			</a>
		</div>
	</div>`;
	list.appendChild(listItem);
}

function clearList(elementName) {
	var parent = document.getElementById(elementName);
    var list = parent.querySelector("ul");
    list.innerHTML = ""; 
}

knownSelectInput.addEventListener("input", () => {
	var knownRooms = getCookie("knownrooms").split(".");
	var realRooms = knownRooms.slice(1);
	updateSearchRooms(knownSelectInput.value, realRooms, "known-room-search-results");
});

newSelectInput.addEventListener("input", async () => {
	var rooms = await fetch("https://api.kiwiandoesthings.place/request_roomSearch?targetName=" + newSelectInput.value + "&userID=" + getCookie("userid") + "&userSecret=" + getCookie("usersecret"));
	var json = await rooms.json();
	if (json == "-1") {
		alert("Your request could not be authenticated. Please clear your cookies and sign in again.");
	}
	clearList("new-room-search-results");
	for (room in json) {
		addVisualRoom(json[room].roomName, json[room].roomID, "new-room-search-results");
	}
});

loadClient();

easyStart();

var roomSelectInput = document.getElementById("new-room-select-input");
var createButton = document.getElementById("room-create-button");
createButton.addEventListener("click", () => {
	var roomName = roomSelectInput.value;
	if (confirm("Are you sure you want to create room \"" + roomName + "\"")) {
		connection.invoke("push_createRoom", roomName, getCookie("userid"), getCookie("usersecret"));
		roomSelectInput.value = "";
	}
});