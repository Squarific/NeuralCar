var SQUARIFIC = SQUARIFIC || {};
SQUARIFIC.neuralCarInstance = {};
SQUARIFIC.neuralCar = {};
var captions = [{
	min: 0,
	max: 0.5,
	color: "green"
}, {
	min: 0.5,
	max: 1,
	color: "gray"
}];
(function() {
    var lastTime = 0;
    var vendors = ['ms', 'moz', 'webkit', 'o'];
    for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
        window.cancelAnimationFrame = window[vendors[x]+'CancelAnimationFrame'] 
                                   || window[vendors[x]+'CancelRequestAnimationFrame'];
    }
 
    if (!window.requestAnimationFrame)
        window.requestAnimationFrame = function(callback, element) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function() { callback(currTime + timeToCall); }, 
              timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };
 
    if (!window.cancelAnimationFrame)
        window.cancelAnimationFrame = function(id) {
            clearTimeout(id);
        };
}());
	function log(m) {
		setTimeout(consoleLog.bind(this, m), 0);
	}
	function consoleLog (m) {
		document.getElementById("console").innerHTML += m + "<br/>";
	}
	function addLayer () {
		var layer = document.createElement("input");
		var label = document.createElement("div");
		label.innerText = "Nodes (click here to remove layer): ";
		label.className = "label";
		label.style.cursor = "pointer";
		layer.type = "number";
		layer.value = 13;
		label.layer = layer;
		label.onclick = function (event) {
			event.target.layer.parentNode.removeChild(event.target.layer);
			event.target.parentNode.removeChild(event.target);
		}
		document.getElementById("layers").appendChild(label);
		document.getElementById("layers").appendChild(layer);
	}
	function pre_start () {
		document.getElementById("console").innerHTML += "Loading simulation... <br/>";
		document.getElementById("topMenu").style.display = "block";
	}
	function start (mapData, width, height, captions) {
		var x, y;
		var container = document.getElementById("screen");
		var amountOfCars = parseInt(document.getElementById("options_cars").value);
		var timePerGen = parseInt(document.getElementById("options_timePerGen").value) * 1000;
		var carWidth = parseInt(document.getElementById("options_car_width").value);
		var carHeight = parseInt(document.getElementById("options_car_height").value);
		var networkStructure = [];
		var layers = document.getElementById("layers");
		while (layers.firstChild) {
			if (layers.firstChild.value && parseInt(layers.firstChild.value) > 0) {
				networkStructure.push(parseInt(layers.firstChild.value));
			}
			layers.firstChild.parentNode.removeChild(layers.firstChild);
		}
		if (networkStructure.length < 1) {
			document.getElementById('errorContainer').innerHTML = '<div class="error">The neural network configuration was wrong, try 1 layer with 13 nodes.</div>';
			return;
		}
		if (!(amountOfCars >= 0)) {
			amountOfCars = 3;
		}
		var background = new SQUARIFIC.neuralCar.BackgroundMap({width: width, height: height}, mapData, captions);
			world = new SQUARIFIC.neuralCar.World({width: width, height: height}, background),
			screen = new SQUARIFIC.neuralCar.Screen(container, world);
		var cars = [];
		for (var i = 0; i < amountOfCars; i++) {
			cars.push(new SQUARIFIC.neuralCar.Car({x: Math.random() * (width - 400) + 200, y: Math.random() * (height - 400) + 200, angle: Math.random() * 3.14, width: carWidth, height: carHeight}, new SQUARIFIC.neuralCar.AIInput({
				networkStructure: networkStructure
			})));
		}
		world.layers.push({
			objects: cars.slice(0),
			lastUpdated: Date.now()
		});
		SQUARIFIC.neuralCarInstance.trainer = new SQUARIFIC.neuralCar.Trainer(cars, {
			timePerGen: timePerGen
		});
		SQUARIFIC.neuralCarInstance.world = world;
		SQUARIFIC.neuralCarInstance.physics = new SQUARIFIC.neuralCar.Physics({}, world);;
		SQUARIFIC.neuralCarInstance.screen = screen;
		SQUARIFIC.neuralCarInstance.cars = cars;
		while (container.firstChild) {
			container.removeChild(container.firstChild);
		}
		document.getElementById("console").innerHTML += "Loaded with Settings: <br/> &nbsp; &nbsp; Cars: " + amountOfCars + "<br/> &nbsp; &nbsp;  NetworkStructure: " + JSON.stringify(networkStructure) + "<br/>";
	}
//Screen Class
	SQUARIFIC.neuralCar.Screen = function Screen (container, worldData) {
		var layers = [];
		if (typeof container !== "object" || typeof container.appendChild !== "function") {
			throw "neuralCar.Screen: container DomElement required.";
		}		
		if (typeof worldData !== "object") {
			throw "neuralCar.Screen: worldData object required.";
		}
		if (!container.style.position) {
			container.style.position = "relative";
		}
		this.createCtx = function (settings) {
			var	canvas = document.createElement("canvas"),
				ctx = canvas.getContext("2d");
			canvas.width = settings.width || 500;
			canvas.height = settings.height || 500;
			canvas.style.position = "absolute";
			canvas.style.left = "0";
			canvas.style.top = "0";
			return ctx;
		};
		this.render = function () {
			var key = 0, objKey, canvas;
			for (; key < worldData.layers.length; key++) {
				if (!layers[key]) {
					layers[key] = {
						lastUpdated: 0,
						ctx: this.createCtx({width: worldData.width, height: worldData.height})
					};
					canvas = container.appendChild(layers[key].ctx.canvas);
				}
				if (layers[key].lastUpdated < worldData.layers[key].lastUpdated) {
					layers[key].ctx.clearRect(0, 0, layers[key].ctx.canvas.width, layers[key].ctx.canvas.height);
					for (objKey = 0; objKey < worldData.layers[key].objects.length; objKey++) {
						worldData.layers[key].objects[objKey].paint(layers[key].ctx);
					}
					layers[key].lastUpdated = Date.now();
				}
			}
		};
		this.loop = function () {
			this.render();
			requestAnimationFrame(this.loop.bind(this));
		};
		requestAnimationFrame(this.loop.bind(this));
	};
//World Class
	SQUARIFIC.neuralCar.World = function World (settings, background) {
		var settings = settings || {};
		this.width = width = settings.width || 500;
		this.height = settings.height || 500;
		this.background = background;
		this.layers = [];
		this.layers[0] = {
			objects: [background],
			lastUpdated: Date.now()
		};
	};
//Physics Class
	SQUARIFIC.neuralCar.Physics = function Physics (settings, worldData) {
		var settings = settings || {},
			lastUpdate = Date.now(),
			tps = settings.tps || settings.ticksPerSecond || 30,
			msPerFrame = Math.round(1000 / tps);
		if (typeof worldData !== "object") {
			throw "neuralCar.Physics: worldData object required.";
		}
		this.update = function physicsUpdate () {
			var msDifference = Date.now() - lastUpdate,
				msUpdated = 0;
			while (msDifference - msPerFrame >= 0) {
				for (var i = 0; i <  worldData.layers.length; i++) {
					for (var k = 0; k < worldData.layers[i].objects.length; k++) {
						if (typeof worldData.layers[i].objects[k].update === "function") {
							worldData.layers[i].objects[k].update(msPerFrame, worldData, this);
							worldData.layers[i].lastUpdated = Date.now();
						}
					}
				}
				msDifference -= msPerFrame;
				msUpdated += msPerFrame;
			}
			lastUpdate += msUpdated;
		};
		this.collision = function collision (x, y, exclude) {
			for (var i = 0; i <  worldData.layers.length; i++) {
				for (var k = 0; k < worldData.layers[i].objects.length; k++) {
					if (worldData.layers[i].objects[k] !== exclude &&
						x >= worldData.layers[i].objects[k].x - worldData.layers[i].objects[k].width &&
						x <= worldData.layers[i].objects[k].x + worldData.layers[i].objects[k].width &&
						y >= worldData.layers[i].objects[k].y - worldData.layers[i].objects[k].height &&
						y <= worldData.layers[i].objects[k].y + worldData.layers[i].objects[k].height) {
						var cos = Math.cos(-worldData.layers[i].objects[k].angle);
						var sin = Math.sin(-worldData.layers[i].objects[k].angle);
						var xt = cos * (x - worldData.layers[i].objects[k].x - worldData.layers[i].objects[k].width / 2) + -sin * (y - worldData.layers[i].objects[k].y - worldData.layers[i].objects[k].height / 2) + worldData.layers[i].objects[k].x + worldData.layers[i].objects[k].width / 2;
						var yt = sin * (x - worldData.layers[i].objects[k].x - worldData.layers[i].objects[k].width / 2) + cos * (y - worldData.layers[i].objects[k].y - worldData.layers[i].objects[k].height / 2) + worldData.layers[i].objects[k].y + worldData.layers[i].objects[k].height / 2;
						/*var x1t = cos * worldData.layers[i].objects[k].x + -sin * worldData.layers[i].objects[k].y;
						var y1t = sin * worldData.layers[i].objects[k].x + cos * worldData.layers[i].objects[k].y;
						var x2t = worldData.layers[i].objects[k].x + worldData.layers[i].objects[k].width;
						var y2t = worldData.layers[i].objects[k].y + worldData.layers[i].objects[k].height;
						x2t = cos * x2t + -sin * y2t;
						y2t = sin * x2t + cos * y2t;*/
						var x1t = worldData.layers[i].objects[k].x;
						var x2t = worldData.layers[i].objects[k].x + worldData.layers[i].objects[k].width;
						var y1t = worldData.layers[i].objects[k].y;
						var y2t = worldData.layers[i].objects[k].y + worldData.layers[i].objects[k].height;
						if (xt >= x1t &&
							xt <= x2t &&
							yt >= y1t &&
							yt <= y2t) {
							return true;
						}
					}
				}
			}
			return false;
		};
		setInterval(this.update.bind(this), msPerFrame);
	};
//Map Class
	SQUARIFIC.neuralCar.BackgroundMap = function (settings, mapData, captions) {
		var settings = settings || {},
			width = settings.width || 500,
			height = settings.height || 500;
		var colorCtxs = {};
		var points = {};
		this.mapData = mapData;
		this.createCtx = function (settings) {
			var	canvas = document.createElement("canvas"),
				ctx = canvas.getContext("2d");
			canvas.width = settings.width || 1;
			canvas.height = settings.height || 1;
			return ctx;
		};
		this.getBlockColor = function (blockNumber) {
			var key = 0, color;
			for (; key < captions.length; key++) {
				if (blockNumber >= captions[key].min && blockNumber <= captions[key].max) {
					color = captions[key].color;
				}
			}
			if (!colorCtxs[color]) {
				colorCtxs[color] = this.createCtx({
					width: 1,
					height: 1
				});
				colorCtxs[color].beginPath();
				colorCtxs[color].rect(0, 0, 1, 1);
				colorCtxs[color].fillStyle = color;
				colorCtxs[color].fill();
			}
			return colorCtxs[color].canvas;
		};
		this.getAverageBlockData = function (x, y, width, height, angle, blocks, physics, exclude) {
			var blocks = blocks || 9,
				blocks = Math.round(Math.sqrt(blocks)) - 1,
				yo = y, xt, yt,
				xm = Math.round(x + width / 2),
				ym = Math.round(y + height / 2),
				sum = 0,
				cos = Math.cos(angle),
				sin = Math.sin(angle),
				xdif = width / blocks,
				ydif = height / blocks,
				width = x + width,
				height = y + height,
				collision;
			blocks = blocks + 1;
			if (xdif <= 0 || ydif <= 0) {
				throw "The width, height or the amount of blocks were causing a negative or zero x/y difference.";
			}
			for (; x <= width; x += xdif) {
				for (y = yo; y <= height; y += ydif) {
					xt = Math.round(cos * (x - xm) + -sin * (y - ym)) + xm;
					yt = Math.round(sin * (x - xm) + cos * (y - ym)) + ym;
					if (!points[xt]) {
						points[xt] = {};
					}
					points[xt][yt] = true;
					if (!physics.collision(xt, yt, exclude)) {
						sum += this.getBlockData(xt, yt);
					} else {
						collision = true;
					}
				}
			}
			if (collision) {
				return 0;
			}
			return sum / blocks / blocks;
		};
		this.getBlockData = function (x, y) {
			if (mapData[x]) {
				return parseFloat(mapData[x][y]);
			} else {
				return 0;
			}
		};
		this.paint = function (ctx, physics) {
			var x, y;
			this.ctx = ctx;
			for (x = 0; x < width; x++) {
				for (y = 0; y < height; y++) {
					ctx.drawImage(this.getBlockColor(this.getBlockData(x, y)), x, y);
					if (physics && physics.collision(x, y)) {
						ctx.drawImage(this.getBlockColor(-1), x, y);
					}
				}
			}
			return ctx;
		};
		this.collisionPaint = function (physics) {
			this.paint(this.ctx, physics);
		};
		this.averageWayPointPaint = function () {
			for (var x in points) {
				for (var y in points[x]) {
					this.ctx.drawImage(this.getBlockColor(-1), x, y);
				}
			}
			points = {};
		};
		this.paintPoints = function paintPoints (points) {
			for (var x in points) {
				for (var y in points[x]) {
					this.ctx.drawImage(this.getBlockColor(-1), x, y);
				}
			}
		};
	};
//Car Class
	SQUARIFIC.neuralCar.Car = function Car (settings, input) {
		this.createCtx = function (settings) {
			var	canvas = document.createElement("canvas"),
				ctx = canvas.getContext("2d");
			canvas.width = settings.width || 50;
			canvas.height = settings.height || 50;
			return ctx;
		};
		this.createBox = function (settings) {
			var ctx = this.createCtx(settings);
			ctx.beginPath();
			ctx.rect(0, 0, settings.width, settings.height);
			ctx.fillStyle = settings.color || "red";
			ctx.fill();
			ctx.beginPath();
			ctx.rect(settings.width - 1, settings.height - 3, settings.width, settings.height - 2);
			ctx.rect(settings.width - 1, 1, settings.width, 3);
			ctx.fillStyle = "yellow";
			ctx.fill();
			return ctx;
		};
		var settings = settings || {};
		this.x = settings.x || 0;
		this.y = settings.y || 0;
		this.width = settings.width || 50;
		this.height = settings.height || 50;
		this.color = settings.color || "red";
		this.image = settings.image || this.createBox({
			width: this.width,
			height: this.height,
			color: settings.color || "red"
		}).canvas;
		this.angle = settings.angle || 0;
		this.speed = 0;
		this.maxSpeed = settings.maxSpeed || settings.speed || 0.1;
		this.acceleration = settings.accel || settings.acceleration || 0.00003;
		this.turning = settings.turning || 0.002;
		this.input = input;
		this.respawn = function () {
			this.speed = settings.speed || 0;
			this.angle = settings.angle || 0;
			this.x = settings.x || 0;
			this.y = settings.y || 0;
		};
		this.changeColor = function (color) {
			if (this.color !== color) {
				this.image = this.createBox({
					width: this.width,
					height: this.height,
					color: color || "red"
				}).canvas;
				this.color = color;
				settings.color = color;
			}
		};
		this.update = function (time, worldData, physics) {
			if (!input) {
				return;
			}
			var inputData = input.getInput(worldData, this, physics), distance, groundSpeed;
			this.angle += this.turning * inputData.angle * time;
			if (this.angle > 3.14) {
				this.angle -= 6.28;
			}
			if (this.angle < -3.14) {
				this.angle += 6.28;
			}
			this.speed += inputData.acceleration * this.acceleration * time;
			if (Math.abs(this.speed) > this.maxSpeed) {
				if (this.speed < 0) {
					this.speed = -this.maxSpeed;
				} else {
					this.speed = this.maxSpeed;
				}
			}
			groundSpeed = worldData.background.getAverageBlockData(Math.round(this.x), Math.round(this.y), this.width, this.height, this.angle, 9, physics, this);
			if (Math.abs(this.speed) > this.maxSpeed * groundSpeed) {
				if (this.speed < 0) {
					this.speed = -this.maxSpeed * groundSpeed;
				} else {
					this.speed = this.maxSpeed * groundSpeed;
				}
			}
			distance = this.speed * time;
			this.x += Math.cos(this.angle) * distance;
			this.y += Math.sin(this.angle) * distance;
			if (this.x < 0) {
				this.x = 0;
				this.speed = 0;
			}
			if (this.y < 0) {
				this.y = 0;
				this.speed = 0;
			}
			if (this.x > worldData.width - this.width) {
				this.x = worldData.width - this.width;
				this.speed = 0;
			}
			if (this.y > worldData.height - this.height) {
				this.y = worldData.height - this.height;
				this.speed = 0;
			}
		};
		this.paint = function (ctx) {
			ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
			ctx.rotate(this.angle);
			ctx.drawImage(this.image, -this.width / 2, -this.height / 2, this.width, this.height);
			ctx.rotate(-this.angle);
			ctx.translate(-(this.x + this.width / 2), -(this.y + this.height / 2));
		};
	};
//PlayerInput Class
	SQUARIFIC.neuralCar.PlayerInput = function PlayerInput () {
		var keysPressed = {};
		this.getInput = function () {
			var key, angle = 0, accel = 0;
			for (key in keysPressed) {
				if (keysPressed.hasOwnProperty(key)) {
					switch (parseInt(key)) {
						case 37: //left
							angle -= 1;
						break;
						case 38: //up
							accel += 1;
						break;
						case 39: //right
							angle += 1;
						break;
						case 40: //down
							accel -= 1;
						break;
					}
				}
			}
			return {
				angle: angle,
				acceleration: accel
			};
		};
		this.keyDown = function (event) {
			keysPressed[parseInt(event.keyCode)] = true;
			event.preventDefault();
		};
		this.keyUp = function (event) {
			delete keysPressed[event.keyCode];
		};
		document.addEventListener("keydown", this.keyDown);
		document.addEventListener("keyup", this.keyUp);
	};
//AIInput Class
	SQUARIFIC.neuralCar.AIInput = function AIInput (settings) {
		this.score = 0;
		function randomNode (weights) {
			var sign = Math.random();
			if (sign > 0.5) {
				sign = 1;
			} else {
				sign = -1;
			}
			var node = {
				bias: sign * Math.random(),
				weights: {}
			};
			for (var b = 0; b <= weights; b++) {
				var sign = Math.random();
				if (sign > 0.5) {
					sign = 1;
				} else {
					sign = -1;
				}
				node.weights[b] = sign * Math.random();
			}
			return node;
		};
		var net = {};
		this.net = net;
		if (!settings.network) {
			net.layers = [{}, {}];
			for (var a = 0; a <= 78; a++) {
				net.layers[0][a] = {};
			}
			for (var a = 0; a <= settings.networkStructure[0]; a++) {
				net.layers[1][a] = randomNode(78);
			}
			for (var layer = 1; layer < settings.networkStructure.length; layer++) {
				net.layers[layer + 1] = {};
				for (var a = 0; a <= settings.networkStructure[layer]; a++) {
					net.layers[layer + 1][a] = randomNode(settings.networkStructure[layer - 1]);
				}
			}
			net.layers[settings.networkStructure.length + 1] = {};
			net.layers[settings.networkStructure.length + 1].acceleration = randomNode(settings.networkStructure[layer]);
			net.layers[settings.networkStructure.length + 1].angle = randomNode(settings.networkStructure[layer]);
		} else {
			net = settings.network;
			this.net = net;
		}
		this.mutateValue = function (value, rate) {
			var rv = value + (Math.random() - Math.random()) * rate * value;
			if (rv === 0) {
				rv = Math.random() - Math.random();
			}
			return rv;
		};
		this.changeNet = function (network) {
			net = network;
			this.net = net;
		};
		this.mutateBrain = function (brain, rate) {
			net = brain;
			this.net = brain;
			for (var a in net.layers[1]) {
				net.layers[1][a].bias = this.mutateValue(net.layers[1][a].bias, rate);
				for (var b in net.layers[1][a].weights) {
					net.layers[1][a].weights[b] = this.mutateValue(net.layers[1][a].weights[b], rate);
				}
			}
		};
		this.run = function (inputs) {
			for(var i = 1; i < net.layers.length; i++) {
				var layer = net.layers[i];
				var outputs = {};
				for(var id in layer) {
					var node = layer[id];
					var sum = node.bias;
					for(var iid in node.weights)
						sum += node.weights[iid] * inputs[iid];
					outputs[id] = (1/(1 + Math.exp(-sum)));
				}
				inputs = outputs;
			}
			return outputs;
		};
		this.worldState = function (sx, sy, xm, ym, angle, stepsX, stepsY, perStep, worldData, carData, physics, pixels) {
			var endX = sx + stepsX * perStep,
				endY = sy + stepsY * perStep;
			var cos = Math.cos(angle);
			var sin = Math.sin(angle);
			var pixelValues = [];
			for (var x = sx; x <= endX; x += perStep) {
				for (var y = sy; y <= endY; y += perStep) {
					xt = Math.round(cos * (x - xm) + -sin * (y - ym) + xm);
					yt = Math.round(sin * (x - xm) + cos * (y - ym) + ym);
					if (physics.collision(xt, yt, carData)) {
						pixelValues.push(0);
					} else {
						pixelValues.push(worldData.background.getBlockData(xt, yt));
					}
				}
			}
			return pixelValues;
		};
		this.getInput = function (worldData, carData, physics) {
			this.score += carData.speed;
			var values = this.worldState(
				carData.x + carData.width / 2,
				carData.y - 4 * carData.height,
				carData.x + carData.width / 2,
				carData.y + carData.height / 2,
				carData.angle,
				6,
				10,
				5,
				worldData,
				carData,
				physics
			);
			values.push(carData.speed / carData.maxSpeed, carData.angle + 3.14 / 6.28);
			values = this.run(values);
			var accel = values.acceleration;
			if (accel < 0.7) {
				accel = 1;
			} else if (accel < 0.75) {
				accel = 0
			} else {
				accel = -1;
			}
			var angle = values.angle;
			if (angle > 0.55) {
				angle = 1;
			} else if (angle > 0.45) {
				angle = 0
			} else {
				angle = -1;
			}
			return {
				acceleration: accel,
				angle: angle
			}
		};
	};
//Trainer Class
	SQUARIFIC.neuralCar.Trainer = function Trainer (cars, settings) {
		var gen = 1, startTime = Date.now();
		var settings = settings || {};
		var scores = [];
		var timePerGen = settings.timePerGen || 15000;
		this.timePerGen = timePerGen;
		if (!cars || cars.length < 1) {
			return;
		}
		this.top = cars[0];
		this.top.input.lastScore = 0;
		function clone(obj) {
			var target = {};
			for (var i in obj) {
				if (obj.hasOwnProperty(i)) {
					if (typeof obj[i]) {
						target[i] = obj[i];
					}
				}
			}
			return target;
		}
		this.stopAndChangeAllToTop = function () {
			if (!this.id) {
				return;
			}
			for (var key = 0; key < cars.length; key++) {
				cars[key].input.changeNet(JSON.parse(JSON.stringify(this.top.input.net)));
				cars[key].respawn();
			}
			clearInterval(this.id);
			delete this.id;
			delete this.top;
			document.getElementById("console").innerHTML += "Simulation ended after " + (Date.now() - startTime) / 1000 + " seconds. <br/>";
		};
		this.addToRunTime = function (seconds) {
			this.timePerGen += seconds * 1000;
			timePerGen = this.timePerGen;
			document.getElementById("console").innerHTML += "New runtime: " + this.timePerGen / 1000 + "seconds. <br/>";
			clearInterval(this.id);
			this.restart();
		};
		this.restart = function () {
			this.id = setInterval(this.reproduce.bind(this), this.timePerGen);
		};
		this.addCar = function (car) {
			cars.push(car);
		};
		this.reproduce = function () {
			var top;
			gen++;
			for (var key = 0; key < cars.length; key++) {
				if (!top || !top.input || !top.input.score || top.input.score < cars[key].input.score) {
					top = cars[key];
				}
			}
			for (var key = 0; key < cars.length; key++) {
				if (typeof cars[key].input.mutateBrain === "function" && cars[key] !== top) {
					cars[key].input.mutateBrain(JSON.parse(JSON.stringify(top.input.net)), 4);
					cars[key].input.lastScore = cars[key].input.score;
					cars[key].input.score = 0;
					cars[key].respawn();
					cars[key].changeColor("red");
				}
			}
			top.input.lastScore = top.input.score;
			top.input.score = 0;
			top.respawn();
			top.changeColor("blue");
			this.top = top;
			var score = Math.round(top.input.lastScore / this.timePerGen * 100000);
			scores.push(score);
			document.getElementById("console").innerHTML += "Generation #" + gen + " after " + (Date.now() - startTime) / 1000 + " seconds. Score: " + score + " <br/>";
		};
		setTimeout(function (timePerGen) {document.getElementById("console").innerHTML += "Generation #" + gen + " after " + (Date.now() - startTime) / 1000 + " seconds. <br/>"; this.id = setInterval(this.reproduce.bind(this), timePerGen);}.bind(this, timePerGen), 0);
	};
