var grid = 16;
var id = "graphMap";
var time_sleep = 50;
var time_sleep_fast = 5;
var w = grid - 1;
var h = grid - 1;
var starting_point = [grid * 10 + 1, grid * 15 + 1];
var end_point = [grid * 40 + 1, grid * 15 + 1];

cleanCanvas(id);

const _top = 0;
const parent = i => ((i + 1) >>> 1) - 1;
const left = i => (i << 1) + 1;
const right = i => (i + 1) << 1;

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

function resizeCanvas(id){
    var canvas = document.getElementById(id);
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

 function drawGrid(w, h, id) {
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

function cleanCanvas(id){
    var canvas = document.getElementById(id);
    var ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawGrid(window.innerWidth, window.innerHeight, id);
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
        if(p[0] != end_point[0] || p[1] != end_point[1]){
            drawRectangle(id, p[0], p[1], w, h, 'green');
        }  
    }
}

// heuristic is the cartesian distance
function heuristicAstar(curr_point){
    var x = curr_point[0], y = curr_point[1];
    var ex = end_point[0], ey = end_point[1];
    return Math.pow(Math.pow(y - ey, 2) + Math.pow(x - ex, 2), 0.5);
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

        // reached goal
        if(px == end_point[0] && py == end_point[1]){
            for(var i = 0; i < curr_path.length; i++){
                var point = curr_path[i];
                var x = point[0];
                var y = point[1];
                // Skip start and end drawing
                if((x == starting_point[0] && y == starting_point[1]) || (x == end_point[0] && y == end_point[1])){
                    continue;
                }
                drawRectangle(id, x, y, grid - 1, grid - 1, 'yellow');
                await sleep(time_sleep_fast);
            }
            break;
        }

        // draw stage
        if(curr_path.length - 1 >= dist){
            console.log("stage: " + dist);
            dist++;
            drawBfsStage(id, q, curr_path.length);
            drawRectangle(id, px, py, w, h, 'green');
            await sleep(time_sleep);
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

async function dfs(){
    cleanCanvas(id);
    var stack = [];
    var starting_path = [{}, starting_point];   // first item is the path history tiles
    stack.push(starting_path);

    // perform dfs search
    while(stack.length > 0){
        var curr_path = stack.pop();  // get oldest path in queue.    path: [[x1, y1], [x2, y2], ...]
        var p = curr_path[curr_path.length - 1];    // get latest point in path.    p: [x, y]
        var px = p[0];
        var py = p[1];

        // reached goal
        if(px == end_point[0] && py == end_point[1]){
            for(var i = 1; i < curr_path.length; i++){
                var point = curr_path[i];
                var x = point[0];
                var y = point[1];
                // Skip start and end drawing
                if((x == starting_point[0] && y == starting_point[1]) || (x == end_point[0] && y == end_point[1])){
                    continue;
                }
                drawRectangle(id, x, y, grid - 1, grid - 1, 'yellow');
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
                if(s in curr_path[0] || x < 0 || y < 0 || x >= window.width || y >= window.height){
                    continue;
                }
                curr_path[0][s] = 1;
                
                // Skip start and end drawing
                if((x == starting_point[0] && y == starting_point[1])){
                    continue;
                }
                if(x != end_point[0] || y != end_point[1]){
                    drawRectangle(id, x, y, grid - 1, grid - 1, 'green');
                }
                let new_path = JSON.parse(JSON.stringify(curr_path));   // deep clone
                new_path.push([x, y]);     // add neighbour to current path
                stack.push(new_path);
            }
        }
        await sleep(time_sleep);
    }
}

async function dijkstra(){
    bfs();  // for unweighted graph
}

async function astar(){
    cleanCanvas(id);
    var pq = new PriorityQueue((a, b) => a[0] < b[0]);
    var dist_to_goal = heuristicAstar(starting_point);
    var starting_path = [starting_point];   // first item is the 
    pq.push([dist_to_goal, starting_path]);

    // perform dfs search
    while(!pq.isEmpty()){
        var curr_path_with_hu = pq.pop();   // get best priority path (shortest dist).    path: [[x1, y1], [x2, y2], ...]
        var curr_path = curr_path_with_hu[1];
        var curr_hu = curr_path_with_hu[0];  
        var curr_dist = curr_path.length - 1;   // not including first node
        var to_beat = curr_dist + curr_hu;  // best distance + huristic path to goal
        var p = curr_path[curr_path.length - 1];    // get latest point in path.    p: [x, y]
        var px = p[0];
        var py = p[1];

        // reached goal
        if(px == end_point[0] && py == end_point[1]){
            for(var i = 1; i < curr_path.length; i++){
                var point = curr_path[i];
                var x = point[0];
                var y = point[1];
                // Skip start and end drawing
                if((x == starting_point[0] && y == starting_point[1]) || (x == end_point[0] && y == end_point[1])){
                    continue;
                }
                drawRectangle(id, x, y, grid - 1, grid - 1, 'yellow');
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
                if(x < 0 || y < 0 || x >= window.width || y >= window.height){
                    continue;
                }
                
                // Skip start and end drawing
                if((x == starting_point[0] && y == starting_point[1])){
                    continue;
                }

                // filter neighbours with worse astar dist
                var n_huristic = heuristicAstar([x, y]);
                var n_dist = curr_dist + 1;
                var n_astar_dist = n_huristic + n_dist;
                if(n_astar_dist > to_beat){
                    continue;
                }

                if(x != end_point[0] || y != end_point[1]){
                    drawRectangle(id, x, y, grid - 1, grid - 1, 'green');
                }
                let new_path = JSON.parse(JSON.stringify(curr_path));   // deep clone
                new_path.push([x, y]);     // add neighbour to current path
                pq.push([n_astar_dist, new_path]);
            }
        }
        await sleep(time_sleep);
    }
}