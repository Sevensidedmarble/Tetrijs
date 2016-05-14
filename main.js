var canvas = document.getElementById('main_canvas'),
    ctx = canvas.getContext('2d'),
    logger = document.getElementById('debug-log'),
    seconds = document.getElementById('seconds'),
    seconds_played = 0,
    unit_size = 16,
    grid_width = unit_size*10,
    grid_height = unit_size*20,
    grid_size = 16,
    tetrominos = {
      i:  [[1],
           [1],
           [1],
           [1]],
      j:  [[0,1],
           [0,1],
           [1,1]],
      l:  [[1,0],
           [1,0],
           [1,1]],
      o:  [[1,1],
           [1,1]],
      s:  [[0,1,1],
           [1,1,0]],
      t:  [[0,1,0],
           [1,1,1]],
      z:  [[1,1,0],
           [0,1,1]]
    }

var current_shape, shapes, speed;


// helper functions
function get_random(obj) {
  var keys = Object.keys(obj)
  return obj[keys[ keys.length * Math.random() << 0]];
};

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

function log() {
  var items = []
  for (var i = 0; i < arguments.length; i++) {
    var item = arguments[i];
    if (typeof item === 'string' || typeof item === 'number') {
      items.push(item);
    } else if (typeof item == 'object') {
      var out = '[';
      for (var key in item) {
        if (item.hasOwnProperty(key)) {
          out += key + '=' + item[key] + ', ';
        }
      }
      items.push(out + ']');
    }
  }
  var message = items.join(' ;; ');
  logger.innerHTML = message + "<br>" + logger.innerHTML;
}

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

var Shape = function () {
  this.x = 5;
  this.y = 0;
  this.type = clone_object(get_random(tetrominos));
  this.w = this.type[0].length;
  this.l = this.type.length;
  this.stopped = false;
  this.set_board_values();
}

Shape.push_new = function() {
  shapes.push(new Shape());
  current_shape = shapes.length - 1;
}

Shape.prototype = {
  set_board_values: function() {
    for(var i = 0; i < this.type.length; i++){
      for(var n = 0; n < this.type[i].length; n++){
        if ( this.type[i][n] == 1 ) {
          board[i+this.x][n+this.y] = true;
        }
      }
    }
  },
  remove_board_values: function() {
    for(var i = 0; i < this.type.length; i++){
      for(var n = 0; n < this.type[i].length; n++){
        if ( this.type[i][n] == 1 ) {
          board[i+this.x][n+this.y] = false;
        }
      }
    }
  },
  remove_squares_from_shape: function(bx,by) {
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
  },
  rotate_self: function() {
    this.remove_board_values();
    this.type = rotate(this.type);
    this.w = this.type[0].length;
    this.l = this.type.length;
    this.set_board_values();
  },
  clear: function() {
    for(var i = 0; i < this.type.length; i++){
      for(var n = 0; n < this.type[i].length; n++){
        if ( this.type[i][n] == 1 ) {
          ctx.clearRect((this.x*unit_size)+(i*unit_size), (this.y*unit_size)+(n*unit_size), unit_size, unit_size);
        }
      }
    }
  },
  draw: function() {
    for(var i = 0; i < this.type.length; i++){
      for(var n = 0; n < this.type[i].length; n++){
        if ( this.type[i][n] == 1 ) {
          draw_rect('rgb(0,180,40)', (this.x*unit_size)+(i*unit_size), (this.y*unit_size)+(n*unit_size), unit_size, unit_size);
        }
      }
    }
  },
  check_x_collision: function() {
    for(var i = 0; i < this.type.length; i++){
      for(var n = 0; n < this.type[i].length; n++){
        if ( i+this.x < 1 || i+this.x > 10 && this.type[i][n] == 1 ) {
          return true;
        }
        if ( this.type[i][n] == 1 && board[i+this.x][n+this.y] == true ) {
          return true;
        }
      }
    }
  },
  check_y_collision: function() {
    for(var i = 0; i < this.type.length; i++){
      for(var n = 0; n < this.type[i].length; n++){
        if ( n+this.y > 20 && this.type[i][n] == 1 ) {
          this.stopped = true;
          return true;
        }
        if ( this.type[i][n] == 1 && board[i+this.x][n+this.y] == true ) {
          this.stopped = true;
          return true;
        }
      }
    }
    return false;
  },
  move: function(dir) {
    log("Move", this.x, dir.x, this.y, dir.y);

    var old_x = this.x;
    var old_y = this.y;
    this.clear();
    this.remove_board_values();

    this.y = this.y + dir.y;
    if (this.check_y_collision()) {
      if (old_y === 0) {
        gameOver();
      }
      this.y = old_y;
    }

    this.x = this.x + dir.x;
    if (this.check_x_collision()) {
      this.x = old_x;
    }

    this.set_board_values();
    this.draw();
    draw_grid();
  },
  drop: function() {
    this.move( {x:0, y:1} );
  },
  drop_to_bottom: function() {
    while (!this.stopped) {
      this.drop();
    }
  }
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
  ctx.strokeStyle = "grey";
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
      shift_shapes_down(y)
    }
  }
}

var board = [];
for (var x = 0; x <= 11; x++) {
  board[x] = [];
  for (var y = 0; y <= 20; y++) {
    board[x][y] = false;
  }
}

function shift_shapes_down(y) {
  for (var i = 0; i < shapes.length; i++) {
    if ( shapes[i] != undefined && shapes[i].y < y ) {
      shapes[i].drop();
    }
  }
}

function draw_board_debug() {
  ctx.fillStyle = "blue";
  ctx.font = "8px Arial";
  for (var x = 1; x <= 10; x++) {
    for (var y = 1; y <= 20; y++) {
      if (board[x][y] == true) {
        ctx.fillText("1", x*unit_size+1, y*unit_size+15);
      } else {
        ctx.fillText("0", x*unit_size+1, y*unit_size+15);
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

function start() {
  current_shape = 0;
  shapes = [];
  speed = 750;
  Shape.push_new();
}

function update() {
  if (shapes[current_shape].stopped) {
    check_lines();
    Shape.push_new();
  }
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drop_shapes();
  draw_stopped_shapes();
  draw_grid();
  // draw_board_debug();
}

// run once at beginning of the game
start();

function faster() {
  window.clearInterval(main_loop);
  speed = Math.max(speed - 250, 100);
  main_loop = window.setInterval(function(){ update(); }, speed);
}

function slower() {
  pause();
  speed = Math.min(speed + 250, 1000);
  resume();
}

function pause() {
  clearInterval(main_loop);
  main_loop = null;
}

function resume() {
  main_loop = setInterval(function() { update(); }, speed);
}

function gameOver() {
  pause();
  log("Game Over");
}

// get called repeatedly throughout the game
main_loop = window.setInterval(function(){
  update();
}, speed);

// set up keyboard events
function keydown_event(e) {
  switch(e.keyCode) {
  case 37:
    // left key pressed
    shapes[current_shape].move( {x:-1, y:0} )
    break;
  case 38:
    // up key pressed
    shapes[current_shape].rotate_self();
    break;
  case 39:
    // right key pressed
    shapes[current_shape].move( {x:1, y:0} )
    break;
  case 40:
    // down key pressed
    shapes[current_shape].drop_to_bottom();
    break;
  case 32:
    // space key pressed
    if (main_loop) {
      pause();
    } else {
      resume();
    }
  }
}

window.addEventListener("keydown", keydown_event, false);

setInterval(function() {
  if (!seconds_played) {
    if (localStorage !== undefined) {
      seconds_played = parseInt(localStorage.getItem('seconds_played')) || 0;
    } else {
      seconds_played = 0;
    }
  }
  seconds_played++;
  seconds.innerText = seconds_played;
  if (localStorage !== undefined) {
    localStorage.setItem('seconds_played', seconds_played);
  }
}, 1000);
