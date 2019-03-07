var enemyLayout = {
  turrets: [
    {origin: {x: 300, y: 280}, radius: 20, rotation: 225, direction: 0, velocity: 0, color: 'rgb(80, 80, 80)'},
  ],

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
  var enemyTurrets = [];

  // ==============================================
  // actions that may be invoked directly by the UI
  // ==============================================

  this.run = function(opts) {
    ship = new Vip(canvas, opts);
    lastUpdate = Date.now();
    interval = setInterval(gameTick, 20);
    var turrets = opts['turrets'] || enemyLayout['turrets'];
    startGame(turrets);
  }

  this.stop = function() { canvas.clear(); if(interval) { clearInterval(interval); interval = null; } }


  // ===================================
  // private functions beyond this point
  // ===================================

  function randInt(exclusiveUpperBound) {
    return Math.floor(Math.random() * exclusiveUpperBound);
  }

  function startGame(turrets) {
    console.log("starting game");
    for(var i = 0; i < turrets.length; i++) {
      var turret = turrets[i];

      enemyTurrets.push(new Turret(canvas, turret));
    }
    started = true;
  }

  function gameTick() {
    var updateTime = Date.now();

    ship.tick(updateTime - lastUpdate);
    var destroyedAsteroids = [];
    for(var a in enemyTurrets) {
      var ast = enemyTurrets[a];
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
    for(var idx in enemyTurrets) {
      var ast = enemyTurrets[idx];
      if(ast.destroyed()) {
        enemyTurrets.splice(idx - offset, 1);
        offset += 1;
      }
    }

    lastUpdate = updateTime;
    canvas.renderAll();
  }
}

function Turret(canvas, options) {
  var __turret = this;
  var canvas = canvas;

  var direction = options.direction;
  var rate = options.velocity;
  var x = options.origin.x;
  var y = options.origin.y;
  var radius = options.radius;
  var color = options.color;
  var createTime = Date.now();
  var hp = 100 * Math.pow(radius, 2.5);
  var destroyed = false;

  var image = new fabric.Circle({
    radius: radius,
    fill: color,
    stroke: 'brown',
    left: x - radius,
    top: y - radius,
    centeredRotation: true,
  });
  canvas.add(image);

  var velocity = {
    x: rate * Math.sin(to_rad(direction)),
    y: rate * Math.cos(to_rad(direction)),
  }

  this.tick = function(elapsed) { gameTick(elapsed); }
  this.image = function() { return image; }
  this.impact = function(opts) { makeImpact(opts); }
  this.destroyed = function() { return destroyed; }

  function gameTick(elapsed) {
    var posLeft = image.left + velocity.x * elapsed / 1000;
    var posTop = image.top - velocity.y * elapsed / 1000;
    if(posLeft > canvas.getWidth()) {
      posLeft = 0;
    }
    else if(posLeft < 0) {
      posLeft = canvas.getWidth();
    }
    if(posTop > canvas.getHeight()) {
      posTop = 0;
    }
    else if(posTop < 0) {
      posTop = canvas.getHeight();
    }

    image.set({left: posLeft, top: posTop});
    image.setCoords();
  }

  function makeImpact(opts) {
    var energy = opts['energy'];
    var mass = opts['mass'];
    hp = hp - (energy * mass * mass);
    if(hp <= 0) {
      destroyed = true;
      canvas.remove(image);
    }
  }
}

function Bullet(canvas, options) {
  var __bullet = this;
  var canvas = canvas;

  var direction = options.direction;
  var shipVelocity = options.shipVelocity;
  var x = options.origin.x;
  var y = options.origin.y;
  var mass = options.mass;
  var energy = options.energy;
  var radius = Math.sqrt(mass);
  var rate = energy / mass;
  var bulletLongevity = 2000;
  var expired = false;
  var impacted = false;
  var createTime = Date.now();
  var prevPoint = new fabric.Point(x, y);
  var color = 'red';

  var image = new fabric.Circle({
    radius: radius,
    fill: color,
    left: x - radius,
    top: y - radius,
    centeredRotation: true,
  });
  canvas.add(image);

  shipVelocity.magnitude * Math.sin(shipVelocity.direction)

  var velocity = {
    x: rate * Math.sin(to_rad(direction)) +
        shipVelocity.magnitude * Math.sin(shipVelocity.direction),
    y: rate * Math.cos(to_rad(direction)) +
        shipVelocity.magnitude * Math.cos(shipVelocity.direction),
  }

  this.tick = function(elapsed) { gameTick(elapsed); }
  this.expired = function() { return expired; }
  this.energy = function() { return energy; }
  this.mass = function() { return mass; }
  this.impacted = function() { return impacted; }
  this.image = function() { return image; }
  this.prevPoint = function() { return prevPoint; }
  this.impact = function() { bulletImpact(); }

  function gameTick(elapsed) {
    if(Date.now() - bulletLongevity > createTime) {
      expired = true;
      canvas.remove(image);
    }
    else if(!impacted) {
      var posLeft = image.left + velocity.x * elapsed / 1000;
      var posTop = image.top - velocity.y * elapsed / 1000;
      if(posLeft > canvas.getWidth()) {
        posLeft = 0;
      }
      else if(posLeft < 0) {
        posLeft = canvas.getWidth();
      }
      if(posTop > canvas.getHeight()) {
        posTop = 0;
      }
      else if(posTop < 0) {
        posTop = canvas.getHeight();
      }

      prevPoint = image.getCenterPoint();

      image.set({left: posLeft, top: posTop});
      image.setCoords();
    }
  }

  function bulletImpact() {
    impacted = true;
    canvas.remove(image);
  }
}

function Vip(canvas, opts) {
  var __ship = this;
  var canvas = canvas;
  if(!opts) opts = {};

  // ship attributes
  var x = opts['x'] || canvas.getWidth() / 2;
  var y = opts['y'] || canvas.getHeight() / 2;
  var velocity = opts['velocity'] || {magnitude: 0, direction: 0};
  var shipMass = opts['ship_mass'] || 2000;
  var shipThrust = opts['ship_thrust'] || 10000;

  // weapons
  var weaponEnergyMax = opts['energy_reserve'] || 10000;
  var weaponEnergy = opts['energy_reserve'] || 10000;
  var firingEnergy = opts['bullet_energy'] || 1000;
  var regenerationRate = opts['regenerationRate'] || 3000;
  var bulletMass = opts['bullet_mass'] || 4;
  var maxFiringRate = opts['firing_rate'] || 15;
  var firing = false;
  var lastFired = 0;
  var bullets = [];

  // movement
  var turning = 0;
  var thrusting = false;
  var rotationRate = opts['rotationRate'] || 10;
  var dragRate = opts['inertial_negator'] || 0.2;
  var shieldStrength = opts['shield_strength'] || 1000;

  // ship status
  var energyBarMaxWidth = 200;
  var energyText = new fabric.Text("ENERGY", {
    fontFamily: "Open Sans",
    left: 100,
    top: 10,
    fontSize: 16,
    fontWeight: 'bold',
    textBackgroundColor: 'rgb(200, 220, 255)',
  });
  canvas.add(energyText);

  var energyBarOutline = new fabric.Rect({
    left: 99,
    top: 29,
    fill: 'white',
    width: energyBarMaxWidth + 2,
    height: 22,
    stroke: 'black',
    strokeWidth: 1,
  });
  canvas.add(energyBarOutline);

  var energyBar = new fabric.Rect({
    left: 100,
    top: 30,
    fill: 'yellow',
    width: energyBarMaxWidth,
    height: 20,
  });
  canvas.add(energyBar);

  // ship images
  var shipHeight = 20;
  var shipWidth = 21;
  var image = new fabric.Polygon(
    [new fabric.Point(10, 0), new fabric.Point(20, 30), new fabric.Point(10, 25), new fabric.Point(0, 30)],
    {fill: 'black', left: x, top: y, angle: 0, centeredRotation: true,}
  );
  canvas.add(image);
  var thrust1 = new fabric.Polygon(
    [ new fabric.Point(0, 5), new fabric.Point(10, 0), new fabric.Point(20, 5),
      new fabric.Point(15, 7), new fabric.Point(10, 5), new fabric.Point(5, 7),
    ], {fill: 'red', angle: 0, centeredRotation: true}
  );
  var shield = new fabric.Circle({
    radius: 20,
    left: image.getCenterPoint().x - shipWidth, top: image.getCenterPoint().y - shipHeight,
    fill: 'white', stroke: 'blue', opacity: 0.2,
  });
  canvas.add(shield);
  setThrustCoords();

  // ================================================
  // actions that may be invoked directly by the Game
  // ================================================
  this.tick = function(elapsed) { gameTick(elapsed) }
  this.bullets = function() { return bullets; }
  this.image = function() { return image; }


  // ===================================
  // private functions beyond this point
  // ===================================

  function setThrustCoords() {
    thrust1.set({ left: 27 * Math.sin(Math.PI + to_rad(image.angle)) + image.left,
      top: 27 * Math.cos(to_rad(image.angle)) + image.top,
      angle: image.angle,
    });
    thrust1.setCoords();
    shield.set({left: image.getCenterPoint().x - shipWidth, top: image.getCenterPoint().y - shipHeight});
    shield.setCoords();
  }

  function gameTick(elapsed) {
    // is the user holding down the 'fire' button?
    if(firing) {
      tryToFire();
    }

    if(weaponEnergy < weaponEnergyMax) {
      weaponEnergy = Math.min(weaponEnergyMax, weaponEnergy + regenerationRate * elapsed / 1000);
      redrawEnergy();
    }

    // update position and add 'drag'
    if(velocity.magnitude > 0) {
      // change position
      changePosition(elapsed);

      // add drag
      velocity.magnitude -= dragRate;
      if(velocity.magnitude < 0) { velocity.magnitude = 0; }
    }

    // is the user holding down either the left or the right button?
    if(turning != 0) {
      image.setAngle(image.angle + turning * rotationRate);
      setThrustCoords();
    }

    // add thrust component to the ship
    if(thrusting) {
      addThrust();
    }

    // eliminate bullets that are end-of-life
    var spliced = 0;
    for(var idx in bullets) {
      bullets[idx].tick(elapsed);
      if(bullets[idx].expired()) {
        bullets.splice(idx - spliced, 1);
        spliced += 1;
      }
    }
  }

  function changePosition(elapsed) {
    var posLeft = image.left + velocity.magnitude * Math.sin(velocity.direction) * elapsed / 1000;
    var posTop = image.top - velocity.magnitude * Math.cos(velocity.direction) * elapsed / 1000;
    if(posLeft > canvas.getWidth()) {
      posLeft = 0;
    }
    else if(posLeft < 0) {
      posLeft = canvas.getWidth();
    }
    if(posTop > canvas.getHeight()) {
      posTop = 0;
    }
    else if(posTop < 0) {
      posTop = canvas.getHeight();
    }

    image.set({left: posLeft, top: posTop});
    image.setCoords();
    setThrustCoords();
  }

  // adds thrust to the ship
  function addThrust() {
    var thrustAmount = shipThrust / shipMass;
    var addX = thrustAmount * Math.sin(to_rad(image.angle));
    var addY = thrustAmount * Math.cos(to_rad(image.angle));
    var xVel = velocity.magnitude * Math.sin(velocity.direction) + addX;
    var yVel = velocity.magnitude * Math.cos(velocity.direction) + addY;

    velocity.magnitude = Math.sqrt(Math.pow(xVel, 2) + Math.pow(yVel, 2));
    velocity.direction = direction_of_vector(yVel, xVel);
  }

  // returns the ship's firing point
  function fireOrigin() {
    var rad = image.getHeight() / 2;
    var center = image.getCenterPoint();
    return {
      x: center.x + rad * Math.sin(to_rad(image.angle)),
      y: center.y - rad * Math.cos(to_rad(image.angle)),
    }
  }

  function redrawEnergy() {
    energyBar.set({width: energyBarMaxWidth * weaponEnergy / weaponEnergyMax});
  }

  // attemps to fire a bullet from this ship
  function tryToFire() {
    var minTimeMet = Date.now() - (1000 / maxFiringRate) > lastFired;
    if(minTimeMet && weaponEnergy >= firingEnergy) {
      var bullet = new Bullet(canvas, {
        origin: fireOrigin(),
        direction: image.angle,
        shipVelocity: velocity,
        mass: bulletMass,
        energy: firingEnergy,
      });
      bullets.push(bullet);

      lastFired = Date.now();
      weaponEnergy -= firingEnergy;
    }
  }
}
