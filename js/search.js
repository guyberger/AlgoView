var grid = 16;
var id = "graphMap";
var time_sleep = 50;
var time_sleep_fast = 5;
var w = grid - 1;
var h = grid - 1;
var starting_point = [grid * 10 + 1, grid * 15 + 1];
var end_point = [grid * 40 + 1, grid * 15 + 1];
var canvas = document.getElementById(id);
var ctx = canvas.getContext('2d');
var walls = {};

var infinity = 99999;

var offsetx = document.getElementById('accordionSidebar').offsetWidth;
var offsety = document.getElementById('topbar').offsetHeight;

var can_draw = false;

var start_icon_name = 'start_icon_pic';
var end_icon_name = 'end_icon_pic';

var green = '#35D073';
var blue = '#5199FF';


cleanCanvas(id);

const _top = 0;
const parent = i => ((i + 1) >>> 1) - 1;
const left = i => (i << 1) + 1;
const right = i => (i + 1) << 1;

function getStartEndPoint(){
    var sp = document.getElementById(start_icon_name);
    var rect = sp.getBoundingClientRect();
    console.log(rect.top, rect.right, rect.bottom, rect.left);
    var x = parseInt((rect.left + rect.right) / 2) - offsetx, y = parseInt((rect.top + rect.bottom) / 2) - offsety;
    var p = alignToSVG(x, y);
    starting_point = [p[0] + 1, p[1] + 1];
    sp = document.getElementById(end_icon_name);
    rect = sp.getBoundingClientRect();
    console.log(rect.top, rect.right, rect.bottom, rect.left);
    x = parseInt((rect.left + rect.right) / 2) - offsetx;
    y = parseInt((rect.top + rect.bottom) / 2) - offsety;
    p = alignToSVG(x, y);
    end_point = [p[0] + 1, p[1] + 1];
}

class PriorityQueue {
  constructor(comparator = (a, b) => a > b) {
    this._heap = [];
    this._comparator = comparator;
  }
  size() {
    return this._heap.length;
  }
  isEmpty() {
    return this.size() == 0;
  }
  peek() {
    return this._heap[_top];
  }
  push(...values) {
    values.forEach(value => {
      this._heap.push(value);
      this._siftUp();
    });
    return this.size();
  }
  pop() {
    const poppedValue = this.peek();
    const bottom = this.size() - 1;
    if (bottom > _top) {
      this._swap(_top, bottom);
    }
    this._heap.pop();
    this._siftDown();
    return poppedValue;
  }
  replace(value) {
    const replacedValue = this.peek();
    this._heap[_top] = value;
    this._siftDown();
    return replacedValue;
  }
  _greater(i, j) {
    return this._comparator(this._heap[i], this._heap[j]);
  }
  _swap(i, j) {
    [this._heap[i], this._heap[j]] = [this._heap[j], this._heap[i]];
  }
  _siftUp() {
    let node = this.size() - 1;
    while (node > _top && this._greater(node, parent(node))) {
      this._swap(node, parent(node));
      node = parent(node);
    }
  }
  _siftDown() {
    let node = _top;
    while (
      (left(node) < this.size() && this._greater(left(node), node)) ||
      (right(node) < this.size() && this._greater(right(node), node))
    ) {
      let maxChild = (right(node) < this.size() && this._greater(right(node), left(node))) ? right(node) : left(node);
      this._swap(node, maxChild);
      node = maxChild;
    }
  }
}

function pointToString(p){
    return p[0].toString() + '+' + p[1].toString();
}

function resizeCanvas(id){
    var canvas = document.getElementById(id);
    canvas.width = window.innerWidth - offsetx;
    canvas.height = window.innerHeight - offsety ;
}

 function drawGrid(w, h, id) {
    var canvas = document.getElementById(id);
    var ctx = canvas.getContext('2d');
    ctx.canvas.width  = w - offsetx;
    ctx.canvas.height = h - offsety ;
    
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

function drawWalls(){
    for (var key in walls){
        var canvas = document.getElementById(id);
        var ctx = canvas.getContext('2d');
        ctx.fillStyle = 'black';
        ctx.fillRect(walls[key][0] + 1, walls[key][1] + 1, grid-1, grid-1);
    }
}

function cleanCanvas(id, clean_walls){
    var canvas = document.getElementById(id);
    var ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width - offsetx, canvas.height - offsety);
    drawGrid(window.innerWidth, window.innerHeight, id);
    if(clean_walls == undefined)
        drawWalls(id);
    else
        walls = {};
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
function drawBfsStage(id, q, len, radius){
    console.log("started draw stage\n");
    for(var i = 0; i < q.length; i++){
        var path = q[i];
        console.log("path to draw: " + path);
        if(path.length > len){
            break;
        }
        var p = path[path.length - 1];
        if(p[0] != end_point[0] || p[1] != end_point[1]){
            var centerX = (p[0] - 1) + (grid / 2);
            var centerY = (p[1] - 1) + (grid / 2);

            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
            ctx.fillStyle = blue;
            ctx.fill();
            //ctx.lineWidth = 5;
            ctx.strokeStyle = '#003300';
            //ctx.stroke();
            //drawRectangle(id, p[0], p[1], _len, _len, 'blue');
        }  
    }
}

// heuristic is the cartesian distance
function heuristicAstar(curr_point){
    var x = curr_point[0], y = curr_point[1];
    var ex = end_point[0], ey = end_point[1];
    return Math.sqrt(Math.pow(y - ey, 2) + Math.pow(x - ex, 2));
}

function isWall(s){     // string of point: "x+y"
    return (s in walls);
}

function updateOffset(){
    offsetx = document.getElementById('accordionSidebar').offsetWidth;
    offsety = document.getElementById('topbar').offsetHeight;
}

// Every search algo starts here
async function startSearch(algo){
    updateOffset();
    getStartEndPoint();
    cleanCanvas(id);
    switch(algo){
        case 'bfs':
            bfs();
            break;
        case 'dfs':
            dfs();
            break;
        case 'dijkstra':
            dijkstra();
            break;
        default:    // astar
            astar();
            break;
    }
}

function drawSingleCircle(p, radius, color){
    if(p[0] != end_point[0] || p[1] != end_point[1]){
        var centerX = (p[0] - 1) + (grid / 2);
        var centerY = (p[1] - 1) + (grid / 2);

        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = '#003300';
    }
}

async function drawSolution(arr, radius){
    for(var i = 0; i < arr.length; i++){
        var p = arr[i];
        if(p[0] != end_point[0] || p[1] != end_point[1]){
            var centerX = (p[0] - 1) + (grid / 2);
            var centerY = (p[1] - 1) + (grid / 2);

            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
            ctx.fillStyle = green;
            ctx.fill();
            ctx.strokeStyle = '#003300';
            await sleep(time_sleep);
        }  
    }
}

// paths are nested arrays
 async function bfs(){
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

        // reached goal
        if(px == end_point[0] && py == end_point[1]){
            var arr = [];
            for(var i = 0; i < curr_path.length; i++){
                var point = curr_path[i];
                var x = point[0];
                var y = point[1];

                // Skip start and end drawing
                if((x == starting_point[0] && y == starting_point[1]) || (x == end_point[0] && y == end_point[1])){
                    continue;
                }
                arr.push([x, y]);
            }
            for(var k = 0; k < (grid / 2); k++){
                drawSolution(arr, k);
                await sleep(time_sleep);
            }
            break;
        }

        if(curr_path.length - 1 >= dist){
            console.log("stage: " + dist);
            dist++;
            for(var k = 0; k < (grid / 2); k++){
                drawBfsStage(id, q, curr_path.length, k);
                drawSingleCircle(curr_path[curr_path.length - 1], k, blue);
                await sleep(time_sleep_fast);
            }
            // await sleep(time_sleep);
        }

        // Adding neighbours
        for(var dx = -1; dx < 2; dx++){
            for(var dy = -1; dy < 2; dy++){
                if(dy * dy == dx * dx){     // skip diagonal neighbours
                    continue;
                }
                var x = px + (dx * grid);
                var y = py + (dy * grid);
                var s = pointToString([x, y]);
                if(s in hist || x < 0 || y < 0 || x >= canvas.width || y >= canvas.height || isWall(s)){
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
    console.log("done");
}

async function dfs(){
    var stack = [];
    var starting_path = [starting_point];
    var visited = {};
    stack.push(starting_path);

    // perform dfs search
    while(stack.length > 0){
        var curr_path = stack.pop();  // get oldest path in queue.    path: [[x1, y1], [x2, y2], ...]
        var p = curr_path[curr_path.length - 1];    // get latest point in path.    p: [x, y]
        var px = p[0];
        var py = p[1];

        if((px != starting_point[0] || py != starting_point[1]) && (px != end_point[0] || py != end_point[1])){
            for(var k = 0; k < (grid / 2); k++){
                drawSingleCircle(p, k, blue);
                await sleep(time_sleep_fast);
            }
        }


        // reached 
        if(px == end_point[0] && py == end_point[1]){
            var arr = [];
            for(var i = 0; i < curr_path.length; i++){
                var point = curr_path[i];
                var x = point[0];
                var y = point[1];

                // Skip start and end drawing
                if((x == starting_point[0] && y == starting_point[1]) || (x == end_point[0] && y == end_point[1])){
                    continue;
                }
                arr.push([x, y]);
            }
            for(var k = 0; k < (grid / 2); k++){
                drawSolution(arr, k);
                await sleep(time_sleep);
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
                var s = pointToString([x, y]);
                if((s in visited) || isWall(s) || x < 0 || y < 0 || x >= canvas.width || y >= canvas.height){
                    continue;
                }
                visited[s] = 1;
                
                // Skip start and end drawing
                if((x == starting_point[0] && y == starting_point[1])){
                    continue;
                }

                // draw neighbours
                // if((px != starting_point[0] || py != starting_point[1]) && (px != end_point[0] || py != end_point[1])){
                //     drawRectangle(id, x, y, grid - 1, grid - 1, 'blue');
                // }

                let new_path = JSON.parse(JSON.stringify(curr_path));   // deep clone
                new_path.push([x, y]);     // add neighbour to current path
                stack.push(new_path);
            }
        }
        // await sleep(time_sleep);
    }
    console.log("done");
}

async function dijkstra(){
    bfs();  // for unweighted graph
}

async function astar(){
    var pq = new PriorityQueue((a, b) => a[0] < b[0]);
    var starting_path = [starting_point]; 
    pq.push([infinity, starting_path]);
    var visited = {};

    // perform astar search
    while(!pq.isEmpty()){
        var curr_path_with_hu = pq.pop();   // get best priority path (shortest dist).    path: [[x1, y1], [x2, y2], ...]
        var curr_path = curr_path_with_hu[1];
        var curr_hu = curr_path_with_hu[0];  
        var curr_dist = curr_path.length - 2;   // not including first node and history
        var to_beat = curr_hu;  // distance + huristic path to goal
        var p = curr_path[curr_path.length - 1];    // get latest point in path.    p: [x, y]
        var px = p[0];
        var py = p[1];

        var s = pointToString([px, py]);
        if(s in visited)
            continue;
        visited[s] = 1;    // add node to visited

        if((px != starting_point[0] || py != starting_point[1]) && (px != end_point[0] || py != end_point[1])){
            for(var k = 0; k < (grid / 2); k++){
                drawSingleCircle(p, k, blue);
                await sleep(time_sleep_fast);
            }
        }

        // reached goal
        if(px == end_point[0] && py == end_point[1]){
            var arr = [];
            for(var i = 0; i < curr_path.length; i++){
                var point = curr_path[i];
                var x = point[0];
                var y = point[1];

                // Skip start and end drawing
                var s = pointToString([x, y]);
                if(isWall(s) || (x == starting_point[0] && y == starting_point[1]) || (x == end_point[0] && y == end_point[1])){
                    continue;
                }
                arr.push([x, y]);
            }
            for(var k = 0; k < (grid / 2); k++){
                drawSolution(arr, k);
                await sleep(time_sleep);
            }
            break;
        }

        // Adding neighbours
        var added = false;
        for(var dx = -1; dx < 2; dx++){
            for(var dy = -1; dy < 2; dy++){
                if(dy * dy == dx * dx){     // skip diagonal neighbours
                    continue;
                }
                var x = px + (dx * grid);
                var y = py + (dy * grid);
                var s = pointToString([x, y]);
                if((s in visited) || isWall(s) || x < 0 || y < 0 || x >= canvas.width || y >= canvas.height){
                    continue;
                }
                
                // Skip start and end drawing
                if((x == starting_point[0] && y == starting_point[1])){
                    continue;
                }

                // filter neighbours with worse astar dist
                var n_huristic = heuristicAstar([x, y]);
                var n_dist = (curr_dist + 1) * grid;    // how many grids we've walked so far
                var n_astar_dist = n_huristic + n_dist;
                
                added = true;
                let new_path = JSON.parse(JSON.stringify(curr_path));   // deep clone
                let new_dist = JSON.parse(JSON.stringify(n_astar_dist));   // deep clone
                new_path.push([x, y]);     // add neighbour to current path
                pq.push([new_dist, new_path]);
            }
        }
    }
    console.log("done");
}

function alignToSVG(x, y){
    while(x % grid){
        x--;
    }
    while(y % grid){
        y--;
    }
    return [x, y];
}

// Draw walls 

var mouseClicked = false, mouseReleased = true;
var orig_color = 'red';
var clicked_color = 'green';
var curr_color = orig_color;

var orig_draw_text = 'Draw walls (off)';
var clicked_draw_text = 'Draw walls (on)';
var curr_draw_text = orig_draw_text;
var curr_draw_state = [orig_color, orig_draw_text];

function switchDrawState(){
    curr_draw_state[0] = (curr_draw_state[0] == orig_color) ? clicked_color : orig_color;
    curr_draw_state[1] = (curr_draw_state[1] == orig_draw_text) ? clicked_draw_text : orig_draw_text;
    return curr_draw_state;
}

function cleanWallState(){
    document.getElementById('draw_walls').style.color = orig_color;
    document.getElementById('draw_walls').innerHTML = orig_draw_text;
    curr_draw_state = [orig_color, orig_draw_text];
    can_draw = false;
}

document.getElementById('draw_walls').addEventListener('click', function(){
    can_draw = !can_draw;
    var state = switchDrawState();
    document.getElementById('draw_walls').style.color = state[0];
    document.getElementById('draw_walls').innerHTML= state[1];
}, false);

document.getElementById(id).addEventListener("click", onMouseClick, false);
document.getElementById(id).addEventListener("mousemove", onMouseMove, false);

function onMouseClick(e) {
    if(can_draw)
        mouseClicked = !mouseClicked;
}

function onMouseMove(e) {
    if(can_draw){
        if (mouseClicked) {
            var offsetx = document.getElementById('accordionSidebar').offsetWidth;
            var offsety = document.getElementById('topbar').offsetHeight;
            console.log("Clicked on canvas, x: " + e.clientX + ", y: " + e.clientY);
            var point = alignToSVG(e.clientX - offsetx, e.clientY - offsety);
            console.log("aligned, x: " + point[0] + ", y: " + point[1]);
            drawRectangle(id, point[0] + 1, point[1] + 1, w, h, 'black');

            // add to walls
            var s = pointToString([point[0] + 1, point[1] + 1]);
            walls[s] = [point[0], point[1]];
        }
    }
}

document.getElementById('draw_walls').style.color = orig_color;
document.getElementById('restart_search').addEventListener('click', function(){
    cleanWallState();
    cleanCanvas(id, true);
});


