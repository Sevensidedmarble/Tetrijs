var canvas = document.getElementById('main_canvas');
var ctx = canvas.getContext('2d');

// helper functions
function transpose(arr) {
  return Object.keys(arr[0]).map(function (c) {
    return arr.map(function (r) {
      return r[c];
    });
  });
}

function rotate(arr) {
  arr = transpose(arr);
  arr.reverse();
  return arr;
}

function clone_object(obj) {
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }
 
    var temp = obj.constructor(); // give temp the original obj's constructor
    for (var key in obj) {
        temp[key] = clone_object(obj[key]);
    }
 
    return temp;
}

var unit_size = 16
var grid_width = unit_size*10;
var grid_height = unit_size*20;
var grid_size = 16;

var i = [[0,1,0,0],
         [0,1,0,0],
         [0,1,0,0],
         [0,1,0,0]]

var j = [[0,1,0],
         [0,1,0],
         [1,1,0]]

var l = [[1,0,0],
         [1,0,0],
         [1,1,0]]

var o = [[1,1],
         [1,1]]

var s = [[0,1,1],
         [1,1,0],
         [0,0,0]]

var t = [[0,1,0],
         [1,1,1],
         [0,0,0]]

var z = [[1,1,0],
         [0,1,1],
         [0,0,0]]



function draw_rect(color, x, y, w, h) {
  ctx.fillStyle = color;
  ctx.fillRect (x, y, w, h);
}

function draw_shape(x,y,shape) {
  for(var i = 0; i < shape.length; i++){
    for(var n = 0; n < shape[i].length; n++){
      if ( shape[i][n] == 1 ) {
        draw_rect('rgb(0,180,40)', x+(i*unit_size), y+(n*unit_size), unit_size, unit_size);
      }
    }
  }
}

var Shape = function (x,y,type) {
  this.x = x;
  this.y = y;
  this.type = type;
  this.stopped = false;
  this.set_board_values = function() {
    for(var i = 0; i < this.type.length; i++){
      for(var n = 0; n < this.type[i].length; n++){
        if ( this.type[i][n] == 1 ) {
          board[i+this.x][n+this.y] = true;
        }
      }
    }
  }
  this.remove_board_values = function() {
    for(var i = 0; i < this.type.length; i++){
      for(var n = 0; n < this.type[i].length; n++){
        if ( this.type[i][n] == 1 ) {
          board[i+this.x][n+this.y] = false;
        }
      }
    }
  }
  this.remove_squares_from_shape = function(bx,by) {
    for(var i = 0; i < this.type.length; i++){
      for(var n = 0; n < this.type[i].length; n++){
        if ( this.type[i][n] == 1 ) {
          if ( ((this.x)+(i)) == bx && ((this.y)+(n)) == by ) {
            this.type[i][n] = 0;
            //ctx.clearRect((this.x*unit_size)+(i*unit_size), (this.y*unit_size)+(n*unit_size), unit_size, unit_size);
          }        
        }
      }
    }
  }
  this.clear = function() {
    for(var i = 0; i < this.type.length; i++){
      for(var n = 0; n < this.type[i].length; n++){
        if ( this.type[i][n] == 1 ) {
          ctx.clearRect((this.x*unit_size)+(i*unit_size), (this.y*unit_size)+(n*unit_size), unit_size, unit_size);
        }
      }
    }
  }
  this.draw = function() {
    for(var i = 0; i < this.type.length; i++){
      for(var n = 0; n < this.type[i].length; n++){
        if ( this.type[i][n] == 1 ) {
          draw_rect('rgb(0,180,40)', (this.x*unit_size)+(i*unit_size), (this.y*unit_size)+(n*unit_size), unit_size, unit_size);
        }
      }
    }
  }
  this.check_x_collision = function() {
    for(var i = 0; i < this.type.length; i++){
      for(var n = 0; n < this.type[i].length; n++){
        if ( this.type[i][n] == 1 && board[i+this.x][n+this.y] == true ) {
          return true;
        }
      }
    }
    if (this.x < 1 || this.x > 9) {
      return true;
    }
  }
  this.check_y_collision = function() {
    for(var i = 0; i < this.type.length; i++){
      for(var n = 0; n < this.type[i].length; n++){
        if ( this.type[i][n] == 1 && board[i+this.x][n+this.y] == true ) {
          this.stopped = true;
          return true;
        }
      }
    }
    if (this.y == 19) {
      this.stopped = true;
    }
  }
  this.move = function(dir) {
    var old_x = this.x;
    var old_y = this.y;
    this.clear();
    this.remove_board_values(); 
    
    this.y = this.y + dir.y;
    if (this.check_y_collision()) {

      this.y = old_y;
    }
    
    this.x = this.x + dir.x;
    if (this.check_x_collision()) {
      this.x = old_x;

    }
    
    this.set_board_values();
    this.draw();
  }
  this.drop = function() {
    this.move( {x:0, y:1} );
    
  }
  this.set_board_values();  
}

function draw_grid(){
  for (var x = 0; x <= grid_width; x += unit_size) {
      ctx.moveTo(0.5 + x + grid_size, grid_size);
      ctx.lineTo(0.5 + x + grid_size, grid_height + grid_size);
  }
  for (var x = 0; x <= grid_height; x += unit_size) {
      ctx.moveTo(grid_size, 0.5 + x + grid_size);
      ctx.lineTo(grid_width + grid_size, 0.5 + x + grid_size);
  }
  ctx.strokeStyle = "black";
  ctx.stroke();
}

function check_lines() {
  for (var y = 0; y <= 20; y++) {
    var complete_line = true;
    for (var x = 1; x <= 10; x++) {    
      if (board[x][y] == false) { 
        complete_line = false;
      }
    }
    if (complete_line) { 
      console.log("line complete!");
      // debugger;
      for (var x = 1; x <= 10; x++) {   
        if (board[x][y] == true) {  
          board[x][y] = false;
          for (var i = 0; i < shapes.length; i++) {
            if (shapes[i] != undefined) {
                shapes[i].remove_squares_from_shape(x,y);
            }
          }
        } 
      }
    }
  }
}

var board = [];
for (var x = 1; x <= 10; x++) {
    board[x] = [];
    for (var y = 1; y <= 20; y++) {
        board[x][y] = false;
    }
} 

function draw_board_debug() {
    ctx.fillStyle = "blue";
    ctx.font = "8px Arial";
    for (var x = 1; x <= 10; x++) {
        for (var y = 1; y <= 20; y++) {
            if (board[x][y] == true) { 
                ctx.fillText("1", x*unit_size, y*unit_size);
            } else {
                ctx.fillText("0", x*unit_size, y*unit_size);
            }
        }
    } 
}



function draw_stopped_shapes() {
  for (var i = 0; i < shapes.length; i++) {
    if (shapes[i] != undefined && shapes[i].stopped == true) {
        shapes[i].draw();
    }
  }
}

function drop_shapes() {
  for (var i = 0; i < shapes.length; i++) {
    if (shapes[i] != undefined && shapes[i].stopped != true) {
        shapes[i].drop();
    }
  }
}



function keydown_event(e) {
  switch(e.keyCode) {
    case 37:
        // left key pressed
        shapes[current_shape].move( {x:-1, y:0} )
        break;
    case 38:
        // up key pressed
        console.table(board);
        break;
    case 39:
        // right key pressed
        shapes[current_shape].move( {x:1, y:0} )
        break;
    case 40:
        // down key pressed
        break;  
  } 
}

var current_shape = 0
var shapes = [];

function get_new_shape(index) {
  shapes[index] = new Shape(5,0,clone_object(o));
  current_shape = index;
}

function start() {
  get_new_shape(current_shape);
}

function update() {
  if (shapes[current_shape].stopped) {
    check_lines();
    get_new_shape(current_shape+1);
  }
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drop_shapes();
  draw_stopped_shapes();
  draw_grid();
  draw_board_debug();
  
}

// run once at beginning of the game
start();

var speed = 400;

function faster() {
  window.clearInterval(main_loop);
  speed = speed - 250;
  main_loop = window.setInterval(function(){ update(); }, speed);
}

function slower() {
  window.clearInterval(main_loop);
  speed = speed + 250;
  main_loop = window.setInterval(function(){ update(); }, speed);
}

// get called repeatedly throughout the game
main_loop = window.setInterval(function(){
  update();
}, speed);

// set up keyboard events
window.addEventListener("keydown", keydown_event, false);