function to_degrees(rad) {
  return rad * 180 / Math.PI;
}

function to_rad(degrees) {
  return degrees * Math.PI / 180;
}

function direction_of_vector(y, x) {
  var dir = 0;
  // Q1, Q4
  if(y >= 0) {
    dir = (Math.PI / 2) - Math.atan2(y, x);
  }
  // Q2, Q3
  else {
    dir = (Math.PI / 2) + Math.abs(Math.atan2(y, x));
  }
  return dir;
}

// calculate the distance from 'toPt' to the line formed by
// pt1 and pt2
function lineDist(toPt, pt1, pt2) {
  var num = Math.abs((pt2.y - pt1.y) * toPt.x - (pt2.x - pt1.x) * toPt.y + pt2.x * pt1.y - pt2.y * pt1.x)
  var denom = Math.sqrt(Math.pow(pt2.y - pt1.y, 2) + Math.pow(pt2.x - pt1.x, 2))
  return num / denom;
}

function circlesIntersect(img1, img2) {
  var distX = img1.getCenterPoint().x - img2.getCenterPoint().x;
  var distY = img1.getCenterPoint().y - img2.getCenterPoint().y;
  var dist = Math.sqrt(Math.pow(distX, 2) + Math.pow(distY, 2));
  return dist <= (img1.radius + img2.radius);
}

function Game(canvas) {
  var __game = this;

  this.canvas = canvas;

  var shipKeyMap = {
    left: 37,
    right: 39,
    thrust: 38,
    fire: 32,
  }

  var gameKeyMap = {
    start: 83,
  }

  // game flow control
  var interval = null;
  var lastUpdate = 0;

  // game state
  var started = false;

  // game artifacts
  var ship;
  var asteroids = [];

  // ==============================================
  // actions that may be invoked directly by the UI
  // ==============================================

  // handles incoming key presses
  this.keydown = function(e) { };
  this.keypress = function(e) { };
  this.keyup = function(e) { };

  this.run = function(opts) {
    ship = new Ship(canvas, opts);
    lastUpdate = Date.now();
    interval = setInterval(gameTick, 20);
    this.keydown = function(e) { keydownEvent(e) };
    this.keypress = function(e) { keypressEvent(e) };
    this.keyup = function(e) { keyupEvent(e) };
    var numAsteroids = opts['asteroids'] || 30;
    startGame(numAsteroids);
  }

  this.stop = function() { canvas.clear(); if(interval) { clearInterval(interval); interval = null; } }


  // =====================================================
  // event handlers for which the UI may provide callbacks
  // =====================================================

  this.onMyEventHandler = null;


  // ===================================
  // private functions beyond this point
  // ===================================

  function keydownEvent(e) {
    if(started) {
      for(var key in shipKeyMap) {
        if(e.keyCode == shipKeyMap[key]) {
          ship.keydown(key);
        }
      }
    }
  }

  function keypressEvent(e) {
    if(started) {
      for(var key in shipKeyMap) {
        if(e.keyCode == shipKeyMap[key]) {
          ship.keypress(key);
        }
      }
    }
  }

  function keyupEvent(e) {
    if(started) {
      for(var key in shipKeyMap) {
        if(e.keyCode == shipKeyMap[key]) {
          ship.keyup(key);
        }
      }
    }
    for(var key in gameKeyMap) {
      if(e.keyCode == gameKeyMap[key]) {
        gameAction(key);
      }
    }
  }

  function gameAction(action) {
    switch(action) {
      case 'start':
        if(!started) {
          startGame();
        }
        break;
    }
  }

  function randInt(exclusiveUpperBound) {
    return Math.floor(Math.random() * exclusiveUpperBound);
  }

  function startGame(numAsteroids) {
    console.log("starting game");
    var protect = 75;
    for(var i = 0; i < numAsteroids; i++) {
      // create an exclusion zone around the center point of the board
      var x = randInt(canvas.getWidth());
      var y = randInt(canvas.getHeight());
      if(Math.abs(x - canvas.getWidth() / 2) < protect && Math.abs(y - canvas.getHeight() / 2) < protect) {
        if(y > canvas.getHeight() / 2) {
          y += protect;
        }
        else {
          y -= protect;
        }
        if(x > canvas.getWidth() / 2) {
          x += protect;
        }
        else {
          x -= protect;
        }
      }

      var asteroid = new Asteroid(canvas, {
        origin: {x: x, y: y},
        radius: randInt(10) + 10,
        direction: randInt(360),
        velocity: Math.random() * 50,
        color: 'rgb(80, ' + randInt(80) + ', ' + randInt(80) + ')',
      });
      asteroids.push(asteroid);
    }
    started = true;
  }

  function gameTick() {
    var updateTime = Date.now();

    ship.tick(updateTime - lastUpdate);
    var destroyedAsteroids = [];
    for(var a in asteroids) {
      var ast = asteroids[a];
      var bullets = ship.bullets();
      ast.tick(updateTime - lastUpdate);

      // collision detection on bullets with asteroids
      var astImg = ast.image();
      for(var b in bullets) {
        var bullet = bullets[b];
        if(bullet.impacted()) {
          continue;
        }
        if(circlesIntersect(bullet.image(), ast.image())) {
          ast.impact({energy: bullet.energy(), mass: bullet.mass() });
          bullet.impact();
        }
      }
    }
    var offset = 0;
    for(var idx in asteroids) {
      var ast = asteroids[idx];
      if(ast.destroyed()) {
        asteroids.splice(idx - offset, 1);
        offset += 1;
      }
    }

    lastUpdate = updateTime;
    canvas.renderAll();
  }
}
