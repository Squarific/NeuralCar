function share (network, score) {
	network = JSON.stringify(network);
	var con = new XMLHttpRequest();
	con.addEventListener("readystatechange", readyStateChange);
	con.open("POST", "save.php");
	con.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	con.send("network=" + encodeURIComponent(network) + "&score=" + encodeURIComponent(score));
}
function showTopList (addToTrainer) {
	var con = new XMLHttpRequest();
	con.addEventListener("readystatechange", function (event) {
		var con = event.target;
		if (con.readyState === 4) {
			if (con.status === 200) {
				var res = JSON.parse(con.responseText);
				if (res.success) {
					showList(res.success, addToTrainer);
				} else {
					error(res.error);
				}
			} else {
				error("There was an error receiving data, are you sure you are connected to the internet?");
			}
		}
	});
	con.open("GET", "topList.php");
	con.send();
}
function readyStateChange (event) {
	var con = event.target;
	if (con.readyState === 4) {
		if (con.status === 200) {
			var res = JSON.parse(con.responseText);
			if (res.success) {
				success("Saved top car.");
			} else {
				error(res.error);
			}
		} else {
			error("There was an error receiving data, are you sure you are connected to the internet?");
		}
	}
}
function error (message) {
	document.getElementById("console").innerHTML += '<div class="error">' + message + '</div>';
}
function success (message) {
	document.getElementById("console").innerHTML += '<div class="success">' + message + '</div>';
}
function showList (list, addToTrainer) {
	var container = document.getElementById("list");
	document.getElementById("listContainer").style.display = "block";
	while (container.firstChild) {
		container.removeChild(container.firstChild);
	}
	for (var key = 0; key < list.length; key++) {
		var el = document.createElement("div");
		el.className = "car-score verified_" + list[key].verified;
		el.innerText = list[key].score;
		el.network = list[key].network;
		el.add = addToTrainer;
		el.addEventListener('click', function (event) {
			var car = new SQUARIFIC.neuralCar.Car({color: "#B012A5", x: Math.random() * 500 + 200, y: Math.random() * 200 + 200, angle: Math.random() * 3.14, width: 10, height: 5}, new SQUARIFIC.neuralCar.AIInput({
				network: event.target.network
			}));
			SQUARIFIC.neuralCarInstance.world.layers[1].objects.push(car);
			if (event.target.add) {
				SQUARIFIC.neuralCarInstance.trainer.addCar(car);
			}
			document.getElementById("listContainer").style.display = "none";
		});
		container.appendChild(el);
	}
}
