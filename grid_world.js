
(function(){

	var GRID_WIDTH = 800*2;
	var GRID_HEIGHT = 350*2;
	var CELL_WIDTH = -1;
	var CELL_HEIGHT = -1;

	var ctx = null;
	var grid = null;
	var reward = null;
	var visited = null;

	var agentX = 0;
	var agentY = 0;
	var lastAgentX = 0;
	var lastAgentY = 0;
	var learning = true;

	function genGrid(rows,cols) {

		CELL_WIDTH = GRID_WIDTH / cols;
		CELL_HEIGHT = GRID_HEIGHT / rows;

		var MAX_DIFF = Math.max(rows, cols);

		grid = [];
		reward = [];
		visited = [];
		for (r=0; r < rows; r++){
			grid.push([]);
			reward.push([]);
			visited.push([]);
			for (c=0; c < cols; c++){
				grid[r].push([]);
				visited[r].push([]);
				var R = (MAX_DIFF - Math.abs(r-c)*Math.abs(r-c));
				R -= 0.10 * (Math.pow(rows-r,2) + Math.pow(cols-c,2));
				R += c*1.0;
				reward[r].push(R);
				for (a=0; a < 4; a++){
					grid[r][c].push(0);
					visited[r][c].push(0);
				}
			}
		}

		// Generate a canvas
		var canvas = document.createElement('canvas');
		canvas.setAttribute("width", GRID_WIDTH);
		canvas.setAttribute("height", GRID_HEIGHT);
		document.body.appendChild(canvas);

		ctx = canvas.getContext('2d');
	}

	function act() {
		var K = 200.0;
		var maxval = grid[agentY][agentX][0] + K/visited[agentY][agentX][0];
		var maxind = 0;
		if (Math.random() > 0.5 || !learning) {
			for (a=1; a < 4; a++) {
				if (grid[agentY][agentX][a] + K/visited[agentY][agentX][a] > maxval) {
					maxval = grid[agentY][agentX][a] + K/visited[agentY][agentX][a];
					maxind = a;
				}
			}
		} else {
			maxind = Math.floor(Math.random()*4);
		}


		switch(maxind) {
			case 0:
				up();
				break;

			case 1:
				right();
				break;

			case 2:
				down();
				break;

			case 3:
				left();
				break;
		}

		visited[agentY][agentX][maxind] += 1;
	}

	function left(){
		console.log('left');
		lastAgentX = agentX;
		lastAgentY = agentY;
		agentX = Math.max(0, agentX - 1);
	}

	function right(){
		console.log('right');
		lastAgentX = agentX;
		lastAgentY = agentY;
		agentX = Math.min(grid[0].length-1, agentX + 1);
	}

	function up(){
		console.log('up');
		lastAgentX = agentX;
		lastAgentY = agentY;
		agentY = Math.max(0, agentY - 1);
	}

	function down() {
		console.log('down');
		lastAgentX = agentX;
		lastAgentY = agentY;
		agentY = Math.min(grid.length-1, agentY + 1);
	}

	function reset() {
		agentX = 0;
		agentY = 0;
		lastAgentX = 0;
		lastAgentY = 0;
		drawGrid();
		setTimeout(function(){
			act();
			drawGrid();
			updateGrid();
		}, 100);
	}

	function updateGrid() {
		var diffX = agentX - lastAgentX;
		var diffY = agentY - lastAgentY;

		if (diffX == 0 && diffY == 0){
			reset();
		}

		var actionIndex = -1;
		if (diffX == 0 && diffY == -1){
			actionIndex = 0;
		} else if (diffX == 1 && diffY == 0){
			actionIndex = 1;
		} else if (diffX == 0 && diffY == 1){
			actionIndex = 2;
		} else if (diffX == -1 && diffY == 0){
			actionIndex = 3;
		}

		// Update the q value
		var DISCOUNT_FACTOR = 0.99;
		var BLEND_FACTOR = 0.50;
		var max_q = null;
		for(a=0; a < 4; a++){
			if(max_q == null) {
				max_q = grid[agentY][agentX][a];
			} else {
				if (grid[agentY][agentX][a] > max_q) {
					max_q = grid[agentY][agentX][a];
				}
			}
		}

		grid[lastAgentY][lastAgentX][actionIndex] = (1.0 - BLEND_FACTOR) * grid[lastAgentY][lastAgentX][actionIndex]
			+ BLEND_FACTOR * (reward[agentY][agentX] + DISCOUNT_FACTOR * max_q);

		act();

		drawGrid();

		setTimeout(function(){
			updateGrid();
		}, 100);
	}

	function drawGrid() {
		ctx.clearRect(0, 0, GRID_WIDTH, GRID_HEIGHT);

		// draw background
		ctx.fillStyle = "#000000";
		ctx.rect(0,0,GRID_WIDTH,GRID_HEIGHT);
		ctx.fill();

		// draw cells
		// ctx.strokeStyle = "#ffffff";
		// for (r=0; r < grid.length; r++){
		// 	for (c=0; c < grid[0].length; c++){
		// 		ctx.rect(c*CELL_WIDTH, r*CELL_HEIGHT, CELL_WIDTH, CELL_HEIGHT);
		// 		ctx.stroke();
		// 	}
		// }

		// get stats for colors
		var medlist = [];
		for (r=0; r < grid.length; r++){
			for(c=0; c < grid[0].length; c++){
				for(a=0; a < 4; a++){
					medlist.push(grid[r][c][a]);
				}
			}
		}
		var median = medlist.sort()[medlist.length/2];

		// draw triangles in cells
		ctx.strokeStyle = "#ffffff";
		for (r=0; r < grid.length; r++){
			for (c=0; c < grid[0].length; c++){
				var vertices = [
					[c*CELL_WIDTH, r*CELL_HEIGHT],
					[(c+1)*CELL_WIDTH, r*CELL_HEIGHT],
					[(c+1)*CELL_WIDTH, (r+1)*CELL_HEIGHT],
					[c*CELL_WIDTH, (r+1)*CELL_HEIGHT]
				];
				var center = [(c+0.5)*CELL_WIDTH, (r+0.5)*CELL_HEIGHT];
				
				for (s=0; s < 4; s++) {
					// Triangles
					var normQ = Math.tanh(Math.pow(grid[r][c][s] - median,3.0));
					var col = "#000000";
					if (normQ < 0) {
						col = 'rgb(' + (-255) * normQ + ', 0,0)';
					} else if (normQ > 0){
						col = 'rgb(0,' + (255) * normQ + ', 0)';
					}

					ctx.fillStyle = col;

					var v1 = vertices[s];
					var v2 = vertices[(s+1)%4];
					ctx.beginPath();
					ctx.moveTo(center[0], center[1]);
					ctx.lineTo(v1[0], v1[1]);
					ctx.lineTo(v2[0], v2[1]);
					ctx.lineTo(center[0], center[1]);
					ctx.stroke();
					ctx.fill();

					// Text
					ctx.font = '12px serif';
					ctx.textAlign = "center";
					var textPoint = [center[0] + (s%2)*0.65*(v1[0] - center[0]), 
						center[1] + (1 - s%2)*0.75*(v1[1] - center[1])];
					ctx.strokeText(parseInt(grid[r][c][s]), textPoint[0], textPoint[1]);
				}

			}
		}		

		// Draw the agent
		ctx.fillStyle = "#ffff00";
		ctx.beginPath();
		ctx.arc((agentX+0.5)*CELL_WIDTH, (agentY+0.5)*CELL_HEIGHT,
			CELL_WIDTH*0.20, 0, 2*Math.PI);
		ctx.fill();

		ctx.fillStyle = "#0099ff";
		ctx.beginPath();
		ctx.arc((agentX+0.5)*CELL_WIDTH, (agentY+0.5)*CELL_HEIGHT,
			CELL_WIDTH*0.18, 0, 2*Math.PI);
		ctx.fill();
	}

	function init() {
		genGrid(4*2,8*2);
	}

	$(document).ready(function(){
		init();
		drawGrid();
	});

	$(document).keydown(function(e){
		switch(e.key){
			case 'ArrowUp':
				up();
				break;
			case 'ArrowDown':
				down();
				break;
			case 'ArrowLeft':
				left();
				break;
			case 'ArrowRight':
				right();
				break;
			case 'd':
				learning = false;
				break;
			case 'r':
				reset();
				break;
		}

		if (e.key.indexOf('Arrow') > -1) {
			updateGrid();
		}
	});

})();
