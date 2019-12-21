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
            <pattern id="smallGrid" width="8" height="8" patternUnits="userSpaceOnUse"> \
                <path d="M 8 0 L 0 0 0 8" fill="none" stroke="gray" stroke-width="0.5" /> \
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
    var start_point_x = grid * 20 + 1;
    var start_point_y = grid * 30 + 1;
    var end_point_x = grid * 100 + 1;
    var end_point_y = start_point_y;
    ctx.fillStyle = 'red';
    ctx.fillRect(start_point_x, start_point_y, grid-1, grid-1);
    ctx.fillStyle = 'blue';
    ctx.fillRect(end_point_x, end_point_y, grid-1, grid-1);

}


var id_graph = "graphMap";

resizeCanvas(id_graph);
drawGrid(window.innerWidth, window.innerHeight, id_graph);
drawStartingPosition(id_graph, 8);  // width of box on grid
