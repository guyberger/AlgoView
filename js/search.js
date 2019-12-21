var grid = 16;
var id = "graphMap";
var time_sleep = 50;
var time_sleep_fast = 5;
var w = grid - 1;
var h = grid - 1;
var starting_point = [grid * 10 + 1, grid * 15 + 1];
var end_point = [grid * 40 + 1, grid * 15 + 1];

function resizeCanvas(id){
    var canvas = document.getElementById(id);
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

var drawGrid = function(w, h, id) {
    var canvas = document.getElementById(id);
    var ctx = canvas.getContext('2d');
    ctx.canvas.width  = w;
    ctx.canvas.height = h;
    
    var data = '<svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg"> \
        <defs> \
            <pattern id="smallGrid" width="16" height="16" patternUnits="userSpaceOnUse"> \
                <path d="M 16 0 L 0 0 0 16" fill="none" stroke="gray" stroke-width="0.5" /> \
            </pattern> \
            <pattern id="grid" width="80" height="80" patternUnits="userSpaceOnUse"> \
                <rect width="80" height="80" fill="url(#smallGrid)" /> \
                <path d="M 80 0 L 0 0 0 80" fill="none" stroke="gray" stroke-width="1" /> \
            </pattern> \
        </defs> \
        <rect width="100%" height="100%" fill="url(#smallGrid)" /> \
    </svg>';

    var DOMURL = window.URL || window.webkitURL || window;
    
    var img = new Image();
    var svg = new Blob([data], {type: 'image/svg+xml;charset=utf-8'});
    var url = DOMURL.createObjectURL(svg);
    
    img.onload = function () {
      ctx.drawImage(img, 0, 0);
      DOMURL.revokeObjectURL(url);
    }
    img.src = url;
}

function drawStartingPosition(id, grid){
    var canvas = document.getElementById(id);
    var ctx = canvas.getContext('2d');

    // draw beginning point
    var start_point_x = starting_point[0];
    var start_point_y = starting_point[1];
    var end_point_x = end_point[0];
    var end_point_y = end_point[1];
    ctx.fillStyle = 'red';
    ctx.fillRect(start_point_x, start_point_y, grid-1, grid-1);
    ctx.fillStyle = 'blue';
    ctx.fillRect(end_point_x, end_point_y, grid-1, grid-1);

}

resizeCanvas(id);
drawGrid(window.innerWidth, window.innerHeight, id_graph);
drawStartingPosition(id, grid);  // width of box on grid

function cleanCanvas(id){
    var canvas = document.getElementById(id);
    var ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawGrid(window.innerWidth, window.innerHeight, id_graph);
    drawStartingPosition(id, grid);  // width of box on grid
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function drawRectangle(id, x, y, w, h, c){
    var canvas = document.getElementById(id);
    var ctx = canvas.getContext('2d');
    ctx.fillStyle = c;
    ctx.fillRect(x, y, w, h);
}

// Draw entire bfs stage (defined by distance from starting point)
function drawBfsStage(id, q, len){
    for(var i = 0; i < q.length; i++){
        var path = q[i];
        console.log("path to draw: " + path);
        if(path.length > len){
            break;
        }
        var p = path[path.length - 1];
        drawRectangle(id, p[0], p[1], w, h, 'green');
    }
}

// paths are nested arrays
async function bfs(){
    cleanCanvas(id);
    var hist = {};
    var q = [];
    var starting_path = [starting_point];
    q.push(starting_path);
    var dist = 1;   // distance from starting point

    // perform bfs search
    while(q.length > 0){
        var curr_path = q.shift();  // get oldest path in queue.    path: [[x1, y1], [x2, y2], ...]
        var p = curr_path[curr_path.length - 1];    // get latest point in path.    p: [x, y]
        var px = p[0];
        var py = p[1];

        // draw stage
        if(curr_path.length - 1 >= dist){
            console.log("stage: " + dist);
            dist++;
            drawBfsStage(id, q, curr_path.length);
            drawRectangle(id, px, py, w, h, 'green');
            await sleep(time_sleep);
        }


        // reached goal
        if(px == end_point[0] && py == end_point[1]){
            for(var i = 0; i < curr_path.length; i++){
                var point = curr_path[i];
                // Skip start and end drawing
                if((x == starting_point[0] && y == starting_point[1]) || (x == end_point[0] && y == end_point[1])){
                    continue;
                }
                drawRectangle(id, point[0], point[1], grid - 1, grid - 1, 'yellow');
                await sleep(time_sleep_fast);
            }
            break;
        }

        // Adding neighbours
        for(var dx = -1; dx < 2; dx++){
            for(var dy = -1; dy < 2; dy++){
                if(dy * dy == dx * dx){     // skip diagonal neighbours
                    continue;
                }
                var x = px + (dx * grid);
                var y = py + (dy * grid);
                var s = x.toString() + "+" + y.toString();
                if(s in hist || x < 0 || y < 0 || x >= window.width || y >= window.height){
                    continue;
                }
                hist[s] = 1;
                
                // Skip start and end drawing
                if((x == starting_point[0] && y == starting_point[1])){
                    continue;
                }
                //drawRectangle(id, x, y, grid - 1, grid - 1, 'green');
                let new_path = JSON.parse(JSON.stringify(curr_path));   // deep clone
                new_path.push([x, y]);     // add neighbour to current path
                q.push(new_path);
            }
        }
    }
}