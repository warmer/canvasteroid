function Asteroid(canvas, options) {
  var __asteroid = this;
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

function option(opts, name, defaultValue) {
  var val = defaultValue;
  if(opts[name]) val = opts[name];
  return val;
}

function GameObject(canvas, opts) {
  var __obj = this;
  var canvas = canvas;
  opts = opts || {};
  var x = opts['x'];
  var y = opts['y'];
  var velocity = opts['velocity'] || {magnitude: 0, direction: 0};
  var mass = opts['mass'];

}

function Ship(canvas, opts) {
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
  this.keydown = function(action) { keydownAction(action) }
  this.keypress = function(action) { keypressAction(action) }
  this.keyup = function(action) { keyupAction(action) }
  this.tick = function(elapsed) { gameTick(elapsed) }
  this.bullets = function() { return bullets; }
  this.image = function() { return image; }


  // =====================================================
  // event handlers for which the UI may provide callbacks
  // =====================================================

  this.onMyEventHandler = null;


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

  function keydownAction(action) {
    switch(action) {
      case 'fire':
        firing = true;
        break;
      case 'left':
        turning = -1;
        break;
      case 'right':
        turning = 1;
        break;
      case 'thrust':
        if(!thrusting) canvas.add(thrust1);
        thrusting = true;
        break;
    }
  }

  function keypressAction(action) {
    switch(action) {
      case 'fire':
        break;
    }
  }

  function keyupAction(action) {
    switch(action) {
      case 'fire':
        firing = false;
        break;
      case 'left':
        turning = 0;
        break;
      case 'right':
        turning = 0;
        break;
      case 'thrust':
        if(thrusting) canvas.remove(thrust1);
        thrusting = false;
        break;
    }
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
