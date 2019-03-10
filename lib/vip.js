function Vip(canvas, opts) {
  var __vip = this;
  var canvas = canvas;
  if(!opts) opts = {};

  var time = 0;

  // vip attributes
  var x = opts['x'] || 0;// canvas.getWidth() / 2;
  var y = opts['y'] || canvas.getHeight() / 2;
  var velocity = opts['velocity'] || {magnitude: 100, angle: to_rad(90)};
  var vipMass = opts['vip_mass'] || 2000;
  var vipThrust = opts['vip_thrust'] || 10000;
  var hp = opts['hp'] || 100;
  var destroyed = false;

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
  var dragRate = opts['inertial_negator'] || 0.0;
  var shieldStrength = opts['shield_strength'] || 1000;

  // vip status
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

  // vip images
  var vipHeight = 20;
  var vipWidth = 21;
  var image = new fabric.Polygon(
    [new fabric.Point(10, 0), new fabric.Point(20, 30), new fabric.Point(10, 25), new fabric.Point(0, 30)],
    {fill: 'black', left: x, top: y, angle: to_rad(90), centeredRotation: true,}
  );
  canvas.add(image);
  var thrust1 = new fabric.Polygon(
    [ new fabric.Point(0, 5), new fabric.Point(10, 0), new fabric.Point(20, 5),
      new fabric.Point(15, 7), new fabric.Point(10, 5), new fabric.Point(5, 7),
    ], {fill: 'red', angle: 0, centeredRotation: true}
  );
  var shield = new fabric.Circle({
    radius: 20,
    left: image.getCenterPoint().x - vipWidth, top: image.getCenterPoint().y - vipHeight,
    fill: 'white', stroke: 'blue', opacity: 0.2,
  });
  canvas.add(shield);
  setThrustCoords();

  // ================================================
  // actions that may be invoked directly by the Game
  // ================================================
  this.tick = function(gameState) { gameTick(gameState) }
  this.image = function() { return image; }
  this.impact = function(opts) { makeImpact(opts); }
  this.destroyed = function() { return destroyed; }

  // ===================================
  // private functions beyond this point
  // ===================================

  function makeImpact(opts) {
    var energy = opts['energy'];
    var mass = opts['mass'];
    var hpLoss = energy * mass * mass;
    console.log("VIP hit - lost " + hpLoss);
    hp = hp - hpLoss;
    if(hp <= 0) {
      destroyed = true;
      //canvas.remove(group);
    }
  }

  function setThrustCoords() {
    thrust1.set({ left: 27 * Math.sin(Math.PI + to_rad(image.angle)) + image.left,
      top: 27 * Math.cos(to_rad(image.angle)) + image.top,
      angle: image.angle,
    });
    thrust1.setCoords();
    shield.set({left: image.getCenterPoint().x - vipWidth, top: image.getCenterPoint().y - vipHeight});
    shield.setCoords();
  }

  function gameTick(gameState) {
    var elapsed = gameState.updateMs;
    // is the user holding down the 'fire' button?
    if(firing) {
      tryToFire(gameState);
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

    // add thrust component to the vip
    if(thrusting) {
      addThrust();
    }
  }

  function changePosition(elapsed) {
    var posLeft = image.left + velocity.magnitude * Math.sin(velocity.angle) * elapsed / 1000;
    var posTop = image.top - velocity.magnitude * Math.cos(velocity.angle) * elapsed / 1000;
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

  // adds thrust to the vip
  function addThrust() {
    var thrustAmount = vipThrust / vipMass;
    var addX = thrustAmount * Math.sin(to_rad(image.angle));
    var addY = thrustAmount * Math.cos(to_rad(image.angle));
    var xVel = velocity.magnitude * Math.sin(velocity.angle) + addX;
    var yVel = velocity.magnitude * Math.cos(velocity.angle) + addY;

    velocity.magnitude = Math.sqrt(Math.pow(xVel, 2) + Math.pow(yVel, 2));
    velocity.angle = angle_of_vector(yVel, xVel);
  }

  // returns the vip's firing point
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

  // attemps to fire a bullet from this vip
  function tryToFire(gameState) {
    var minTimeMet = time - (1000 / maxFiringRate) > lastFired;
    if(minTimeMet && weaponEnergy >= firingEnergy) {
      var bullet = new Bullet(canvas, {
        origin: fireOrigin(),
        angle: image.angle,
        originVelocity: velocity,
        mass: bulletMass,
        energy: firingEnergy,
        source: __vip,
      });
      gameState.bullets.push(bullet);

      lastFired = time;
      weaponEnergy -= firingEnergy;
    }
  }
}
