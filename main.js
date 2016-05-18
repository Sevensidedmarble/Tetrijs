var canvas = document.getElementById('main_canvas'),
    ctx = canvas.getContext('2d'),
    logger_element = document.getElementById('debug-log'),
    seconds_element = document.getElementById('seconds'),
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

var current_shape, shapes, speed, score, game_score, high_score;
var high_score_element = document.getElementById('high-score');
var score_element = document.getElementById('score');
var level = 1;
var xp = level;
var level_element = document.getElementById('level');

var board = [];
for (var x = 0; x <= 11; x++) {
    board[x] = [];
    for (var y = 0; y <= 20; y++) {
        board[x][y] = false;
    }
} 

// helper functions

function hex_to_rgb(hex) {
    // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
    var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, function(m, r, g, b) {
        return r + r + g + g + b + b;
    });

    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

function desaturate(r, g, b) {
  var intensity = 0.03 * r + 0.059 * g + 0.011 * b;
  var k = 1;
  r = Math.floor(intensity * k + r * (1 - k));
  g = Math.floor(intensity * k + g * (1 - k));
  b = Math.floor(intensity * k + b * (1 - k));
  return [r, g, b];
}

function rgb_to_string(r, g, b) {
  return 'rgb(' + r + ', ' + g + ', ' + b + ')';
}

/*
  onCSSAnimationEnd function below license:
	By Osvaldas Valutis, www.osvaldas.info
	Available for use under the MIT License
*/

;( function ( document, window, index )
{
	var s = document.body || document.documentElement, s = s.style, prefixAnimation = '', prefixTransition = '';

	if( s.WebkitAnimation == '' )	prefixAnimation	 = '-webkit-';
	if( s.MozAnimation == '' )		prefixAnimation	 = '-moz-';
	if( s.OAnimation == '' )		prefixAnimation	 = '-o-';

	if( s.WebkitTransition == '' )	prefixTransition = '-webkit-';
	if( s.MozTransition == '' )		prefixTransition = '-moz-';
	if( s.OTransition == '' )		prefixTransition = '-o-';

	Object.prototype.onCSSAnimationEnd = function( callback )
	{
		var runOnce = function( e ){ callback(); e.target.removeEventListener( e.type, runOnce ); };
		this.addEventListener( 'webkitAnimationEnd', runOnce );
		this.addEventListener( 'mozAnimationEnd', runOnce );
		this.addEventListener( 'oAnimationEnd', runOnce );
		this.addEventListener( 'oanimationend', runOnce );
		this.addEventListener( 'animationend', runOnce );
		if( ( prefixAnimation == '' && !( 'animation' in s ) ) || getComputedStyle( this )[ prefixAnimation + 'animation-duration' ] == '0s' ) callback();
		return this;
	};

	Object.prototype.onCSSTransitionEnd = function( callback )
	{
		var runOnce = function( e ){ callback(); e.target.removeEventListener( e.type, runOnce ); };
		this.addEventListener( 'webkitTransitionEnd', runOnce );
		this.addEventListener( 'mozTransitionEnd', runOnce );
		this.addEventListener( 'oTransitionEnd', runOnce );
		this.addEventListener( 'transitionend', runOnce );
		this.addEventListener( 'transitionend', runOnce );
		if( ( prefixTransition == '' && !( 'transition' in s ) ) || getComputedStyle( this )[ prefixTransition + 'transition-duration' ] == '0s' ) callback();
		return this;
	};
}( document, window, 0 ));


function get_random(obj) {
    var keys = Object.keys(obj)
    return obj[keys[ keys.length * Math.random() << 0]];
};

function get_random_color() {
    var letters = 'ABCDE'.split('');
    var color = '#';
    for (var i=0; i<3; i++ ) {
        color += letters[Math.floor(Math.random() * letters.length)];
    }
    return color;
}

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
  this.w = type[0].length;
  this.l = type.length;
  this.stopped = false;
  this.color = get_random_color();
  this.shadow_position = y;
  this.set_shadow_position = function() {
    var bottom;
    var old_y = this.y;
    while (!bottom) {
      for(var i = 0; i < this.type.length; i++){
        for(var n = 0; n < this.type[i].length; n++){
          if ( n+this.y > 20 && this.type[i][n] == 1 ) {
            bottom = this.y-1;
          }
          if ( this.type[i][n] == 1 && board[i+this.x][n+this.y] == true ) {
            bottom = this.y-1;
          }
        }
      }
      this.y++;
    }
    this.y = old_y;
    this.shadow_position = bottom;
  }
  this.draw_shadow = function() {
    for(var i = 0; i < this.type.length; i++){
      for(var n = 0; n < this.type[i].length; n++){
        if ( this.type[i][n] == 1 ) {
          draw_rect('grey', (this.x*unit_size)+(i*unit_size), (this.shadow_position*unit_size)+(n*unit_size), unit_size, unit_size);
        }
      }
    }
  }
  this.clear_shadow = function() {
    for(var i = 0; i < this.type.length; i++){
      for(var n = 0; n < this.type[i].length; n++){
        if ( this.type[i][n] == 1 ) {
          ctx.clearRect((this.x*unit_size)+(i*unit_size), (this.shadow_position*unit_size)+(n*unit_size), unit_size, unit_size);
        }
      }
    }
  }
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
  this.rotate_self = function() {
    this.remove_board_values();
    this.type = rotate(this.type);
    this.set_board_values();
  }
  this.clear = function() {
    for(var i = 0; i < this.type.length; i++){
      for(var n = 0; n < this.type[i].length; n++){
        if ( this.type[i][n] == 1 ) {
          ctx.clearRect((this.x*unit_size)+(i*unit_size), (this.y*unit_size)+(n*unit_size), unit_size, unit_size);
        }
      }
    }
    this.clear_shadow();
  }
  this.draw = function() {
    this.draw_shadow();
    for(var i = 0; i < this.type.length; i++){
      for(var n = 0; n < this.type[i].length; n++){
        if ( this.type[i][n] == 1 ) {
          draw_rect(this.color, (this.x*unit_size)+(i*unit_size), (this.y*unit_size)+(n*unit_size), unit_size, unit_size);
        }
      }
    }
  }
  this.check_x_collision = function() {
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
  }
  this.check_y_collision = function() {
    for(var i = 0; i < this.type.length; i++){
      for(var n = 0; n < this.type[i].length; n++){
        if ( n+this.y > 20 && this.type[i][n] == 1 ) {
          this.stopped = true;
          this.clear_shadow();
          return true;
        }
        if ( this.type[i][n] == 1 && board[i+this.x][n+this.y] == true ) {
          this.stopped = true;
          this.clear_shadow();
          return true;
        }
      }
    }
    // if ( this.y == (20-this.l) ) {
    //   this.stopped = true;
    // }
  }
  this.set_position = function(new_x,new_y) {
    var old_x = this.x;
    var old_y = this.y;
    this.clear();
    this.remove_board_values(); 
    this.set_shadow_position();
    
    
    this.y = new_y;
    if (this.check_y_collision()) {

      this.y = old_y;
    }
    
    this.x = old_x;
    if (this.check_x_collision()) {
      this.x = old_x;

    }
    
    this.set_board_values();
    this.draw();
  
  }
  this.move = function(dir) {
    var old_x = this.x;
    var old_y = this.y;
    this.clear();
    this.remove_board_values(); 
    
    this.set_shadow_position();
    
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
  }
  this.drop = function() {
    this.move( {x:0, y:1} );
  }
  this.drop_to_bottom = function() {
    while (!this.stopped) {
      this.drop(); 
    }
  }
  this.set_board_values();
  // this.set_shadow_position();
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
      xp++;
      if ( xp > Math.pow(1.07, level) ) {
        level++;
      }
      score += 1000;
      add_increment_effect(1000);
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
      score = score + 15;
    }
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




function add_increment_effect(amount) {
  var span = document.createElement("span");
  var string = "+" + amount + "!"; 
  var text = document.createTextNode(string);
  span.appendChild(text);
  span.classList.add("fade_up");
  span.onCSSAnimationEnd( function() { span.parentNode.removeChild(span); });
  score_element.insertAdjacentElement('afterend', span);
}


function get_new_shape(index) {
  shapes[index] = new Shape(5,0,clone_object(get_random(tetrominos)));
  current_shape = index;
}

function start() {
  current_shape = 0;
  shapes = [];
  speed = 400;
  score = 0;
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
  score++;
  score_element.innerHTML = score;
  level_element.innerHTML = level;
  // draw_board_debug();
}

// run once at beginning of the game
start();
// add_increment_effect()

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

function pause() {
  clearInterval(main_loop);
  main_loop = null;
}

function resume() {
  main_loop = setInterval(function() { update(); }, speed);
}

function gameOver() {
  pause();
  console.log("Game Over");
  game_score = score;
  if (game_score > high_score) {
    high_score = game_score;
    high_score_element.innerHTML = high_score;
    if (localStorage !== undefined) {
      localStorage.setItem('high_score', high_score);
    }
  }
}

function keydown_event(e) {
  switch(e.keyCode) {
    case 37:
        // left key
        shapes[current_shape].move( {x:-1, y:0} )
        break;
    case 38:
        // up key
        shapes[current_shape].rotate_self();
        break;
    case 39:
        // right key
        shapes[current_shape].move( {x:1, y:0} )
        break;
    case 40:
        // down key
        shapes[current_shape].drop_to_bottom();
        break;  
    case 32:
      // space key
      if (main_loop) { pause(); } else { resume(); }
  } 
}

// get called repeatedly
main_loop = window.setInterval(function(){
  update();
}, speed);

// set up keyboard events
window.addEventListener("keydown", keydown_event, false);

setInterval(function() {
  if (!high_score) {
    if (localStorage !== undefined) {
      high_score = parseInt(localStorage.getItem('high_score')) || 0;
    } else {
      high_score = 0;
    }
  }
  high_score_element.innerHTML = high_score;
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