var squareMap = [];
for (x = 0; x < 900; x++) {
	squareMap[x] = [];
	for (y = 0; y < 600; y++) {
		if (x > 50 && x < 850 && y > 50 && y < 550 && (x < 100 ||
			(x > 250 && x < 300) ||
			(x > 600 && x < 650) ||
			x > 800||
			(y > 50 && y < 100) ||
			(y > 250 && y < 300) ||
			y > 500)) {
			squareMap[x][y] = 1;
		} else {
			squareMap[x][y] = 0.2;
		}
	}
}
