var SQUARIFIC = SQUARIFIC || {};
SQUARIFIC.mapEditor = {};

/* Project specific */
SQUARIFIC.mapEditorInstance = {};
function output () {
	document.getElementById("output_captions").innerText = JSON.stringify(captions);
	document.getElementById("output_mapData").innerText = JSON.stringify(SQUARIFIC.mapEditorInstance.inputHandler.mapData);
	document.getElementById("output").style.display = "block";
}
function caption () {
	var id = parseInt(document.getElementById("caption_id").value),
		min = parseFloat(document.getElementById("caption_min").value),
		max = parseFloat(document.getElementById("caption_max").value),
		color = document.getElementById("caption_color").value;
	captions[id] = {min: min, max: max, color: color};
	var output = '';
	for (var key = 0; key < captions.length; key++) {
		output += key + ": {min: " + captions[key].min + ", max: " + captions[key].max + ", color: " + captions[key].color + "}<br/>";
	}
	document.getElementById("captions").innerHTML = output;
	SQUARIFIC.mapEditorInstance.inputHandler.redraw();
}
function proccess () {
	var error = false;
	try {
		var mapData = JSON.parse(document.getElementById("mapData").value);
	} catch (e) {
		document.getElementById("error").innerHTML = '<div class="errorMessage">' + e + '</div>';
		error = true;
	}
	if (!error) {
		document.getElementById("error").innerHTML = '';
		var w, h;
		w = mapData.length;
		for (var x in mapData) {
			if (!h || mapData[x].length > h) {
				h = mapData[x].length;
			}
		}
		SQUARIFIC.mapEditorInstance.inputHandler.changeMap(mapData, w, h);
	}
}
function fill () {
	if (!SQUARIFIC.mapEditorInstance.filled) {
		var width = parseInt(document.getElementById("fill-width").value),
			height = parseInt(document.getElementById("fill-height").value),
			back = parseFloat(document.getElementById("fill-background").value);
		var x, y;
		var map = {};
		for (x = 0; x < width; x++) {
			map[x] = {};
			for (y = 0; y < height; y++) {
				map[x][y] = back;
			}
		}
		SQUARIFIC.mapEditorInstance.filled = true;
		SQUARIFIC.mapEditorInstance.inputHandler.changeMap(map, width, height);
	}
}

/* Classes */
SQUARIFIC.mapEditor.InputHandler = function InputHandler (container, settings, map, captions) {
	var captions = {};
	this.mapData = {};
	this.captions = captions;
	var settings = settings || {};
	var width = settings.width;
	var height = settings.height;
	var painting = false;
	settings.brush = settings.brush || 1;
	settings.brushShape = "round";
	settings.brushSize = settings.brushSize || 5;
	this.changeBrushSize = function (br) {
		settings.brushSize = parseInt(br);
	};
	this.changeBrushShape = function (sh) {
		settings.brushShape = sh;
	};
	this.changeBrush = function (br) {
		settings.brush = parseFloat(br);
	};
	this.changeMap = function (m, w, h) {
		this.mapData = m;
		map.changeMapData(this.mapData);
		map.changeSize({
			width: w,
			height: h
		});
		container.canvas.width = w;
		container.canvas.height = h;
		width = w;
		height = h;
		map.paint(container);
	};
	this.onMouseMove = function mouseOver (event) {
		if (painting) {
			var brushSize = (settings.brushSize / 2);
			var clientX = event.offsetX;
			var clientY = event.offsetY;
			var xMin = Math.floor(clientX - brushSize),
				xMax = Math.ceil(clientX + brushSize),
				yMin = Math.floor(clientY - brushSize),
				yMax = Math.ceil(clientY + brushSize);
			var x, y;
			for (x = xMin; x <= xMax; x++) {
				for (y = yMin; y <= yMax; y++) {
					if (x <= width && y <= height) {
						if (settings.brushShape === "round") {
							var distance = (x - clientX) * (x - clientX) + (y - clientY) * (y - clientY);
							if (distance <= brushSize * brushSize) {
								container.drawImage(map.getBlockColor(settings.brush), x, y);
								this.mapData[x][y] = settings.brush;
							}
						} else {
							container.drawImage(map.getBlockColor(settings.brush), x, y);
							this.mapData[x][y] = settings.brush;
						}
					}
				}
			}
		}
	};
	this.onMouseDown = function mouseDown (event) {
		painting = true;
	};
	this.onMouseUp = function mouseUp (event) {
		painting = false;
	};
	this.paint = function (points, captions) {
		var x, y;
		for (x in points) {
			for (y in points[y]) {
				ctx.drawImage(map.getBlockColor(points[x][y]), x, y);
			}
		}
	};
	this.redraw = function () {
		map.paint(container);
	};
	container.canvas.addEventListener("mousedown", this.onMouseDown);
	container.canvas.addEventListener("mouseup", this.onMouseUp);
	container.canvas.addEventListener("mousemove", this.onMouseMove.bind(this));
};
SQUARIFIC.mapEditor.BackgroundMap = function BackgroundMap (settings, mapData, captions) {
	var settings = settings || {},
		width = settings.width || 500,
		height = settings.height || 500;
	var colorCtxs = {};
	var points = {};
	this.changeSize = function (s) {
		width = s.width;
		height = s.height;
	};
	this.changeMapData = function (m) {
		mapData = m;
	};
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
	this.getBlockData = function (x, y) {
		if (mapData[x]) {
			return mapData[x][y];
		} else {
			return 0;
		}
	};
	this.paint = function (ctx) {
		var x, y;
		this.ctx = ctx;
		for (x = 0; x < width; x++) {
			for (y = 0; y < height; y++) {
				ctx.drawImage(this.getBlockColor(this.getBlockData(x, y)), x, y);
			}
		}
		return ctx;
	};
};
var captions = [{
	min: 0,
	max:0.5,
	color: "green"
},{
	min: 0.5,
	max: 1,
	color: "gray"
}];
