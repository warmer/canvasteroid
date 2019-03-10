function to_rad(degrees) {
  return degrees * Math.PI / 180;
}

function to_degrees(rad) {
  return rad * 180 / Math.PI;
}

function angle_of_vector(y, x) {
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
  return dist <= ((img1.width / 2) + (img2.width / 2));
}

function Turret(canvas, opts) {
  var __turret = this;
  var canvas = canvas;
  var gridSnap = 10;
  var angleSnap = 10;
  var time = 0;

  // physical details
  var top = opts.top || 100;
  var left = opts.left || 100;
  var angle = opts.angle || 0;
  var velocity = opts['velocity'] || {magnitude: 0, angle: 0};

  // weapons
  var firingEnergy = opts['bullet_energy'] || 1000;
  var weaponEnergy = opts['energy_reserve'] || firingEnergy
  var weaponEnergyMax = opts['energy_reserve'] || firingEnergy;
  var regenerationRate = opts['regenerationRate'] || 3000;
  var bulletMass = opts['bullet_mass'] || 4;
  var firing = false;
  var lastFired = 0;

  var cannon = new fabric.Line([7, 0, 7, 15], {
    fill: 'black', stroke: 'black', strokeWidth: 4, selectable: false, evented: false,
  });
  var rect = new fabric.Rect({
    fill: '#000', top: 10, left:0, width: 16, height: 16, centeredRotation: true,
  });
  rect.setGradient('fill', {
    x1: 0, y1: 0, x2: 0, y2: rect.height,
    colorStops: {
      0.0: '#000',
      0.1: '#f00',
      0.2: '#000',
      0.3: '#f00',
      0.4: '#000',
      0.7: '#f00',
      1.0: '#000',
    },
  });
  var group = new fabric.Group([cannon, rect], {
    left: left, top: top, angle: angle,
    lockScalingX: true, lockScalingY: true, centeredRotation: false,
  });
  group.setControlsVisibility({bl: false, br: false, mb: false, ml: false, mr: false, mt: false, tl: false, tr: false});
  group.on('moved', snapToGrid);
  group.on('rotated', snapToGrid);

  canvas.add(group);

  var hp = 100;
  var destroyed = false;
  var energy = 100;

  this.reposition = function(hash) {
    group.left = hash.left;
    group.top = hash.top;
    group.angle = hash.angle;
  }
  this.tick = function(gameState) { gameTick(gameState); }
  this.image = function() { return group; }
  this.impact = function(opts) { makeImpact(opts); }
  this.destroyed = function() { return destroyed; }

  this.toHash = function() {
    return {
      angle: group.angle || 0,
      left: group.left,
      top: group.top,
    }
  }

  // ===================================
  // private functions beyond this point
  // ===================================

  function snapToGrid() {
    group.left = Math.round(group.left / gridSnap) * gridSnap;
    group.top = Math.round(group.top / gridSnap) * gridSnap;
    group.angle = Math.round(group.angle / angleSnap) * angleSnap;
  }

  function gameTick(gameState) {
    var elapsed = gameState.updateMs;
    time += elapsed;
    if(weaponEnergy < weaponEnergyMax) {
      weaponEnergy = Math.min(weaponEnergyMax, weaponEnergy + regenerationRate * elapsed / 1000);
    }
    tryToFire(gameState);
  }

  // returns the firing point
  function fireOrigin() {
    var rad = group.height / 2;
    var center = group.getCenterPoint();
    return {
      x: center.x + rad * Math.sin(to_rad(group.angle)),
      y: center.y - rad * Math.cos(to_rad(group.angle)),
    }
  }

  // attemps to fire a bullet
  function tryToFire(gameState) {
    if(weaponEnergy >= firingEnergy) {
      var bullet = new Bullet(canvas, {
        origin: fireOrigin(),
        angle: group.angle,
        originVelocity: velocity,
        mass: bulletMass,
        energy: firingEnergy,
        source: __turret,
      });
      gameState.bullets.push(bullet);

      lastFired = time;
      weaponEnergy -= firingEnergy;
    }
  }

  function makeImpact(opts) {
    var energy = opts['energy'];
    var mass = opts['mass'];
    hp = hp - (energy * mass * mass);
    if(hp <= 0) {
      destroyed = true;
      //canvas.remove(group);
    }
  }
}

function EnemyBoard(canvas) {
  var __enemyBoard = this;
  this.canvas = canvas;
  var gridSpacing = 20;

  canvas.selectionColor = 'rgba(0, 0, 0, 0.3)';
  canvas.selectionBorderColor = 'red';
  canvas.selectionLineWidth = 2;
  // TODO: remove scaling options from selections
  // TODO: add event handlers for selections, then on the selection target,
  // add an event handler that listens for moves and rotations. On a move or
  // rotation, every object in the selection should be snapped to the grid.
  // For now, though - disable all selection (must manually move each object)
  canvas.selection = false;
  //canvas.on('selection:created', function(e) {
  //  console.log('selection created');
  //  console.log(e);
  //  console.log(this);
  //});
  //canvas.on('selection:updated', function(e) {
  //  console.log('selection updated');
  //  console.log(e);
  //  console.log(this);
  //});
  //canvas.on('selection:cleared', function(e) {
  //  console.log('selection cleared');
  //  console.log(e);
  //  console.log(this);
  //});

  var gridLines = [];

  // horizontal grid lines
  for(var i = 1; i < canvas.height / gridSpacing; i++) {
    var gridLine = new fabric.Line([0, i * gridSpacing, canvas.width, i * gridSpacing], {
      stroke: '#ccc', strokeWidth: 1,
      selectable: false, evented: false,
    });
    gridLines.push(gridLine);
  }
  // vertical grid lines
  for(var i = 1; i < canvas.width / gridSpacing; i++) {
    var gridLine = new fabric.Line([i * gridSpacing, 0, i * gridSpacing, canvas.height], {
      stroke: '#ccc', strokeWidth: 1,
      selectable: false, evented: false,
    });
    gridLines.push(gridLine);
  }
  var gridGroup = new fabric.Group(gridLines, {
    left: 0, top: 0,
    lockScalingX: true, lockScalingY: true, selectable: false, evented: false,
  });

  canvas.add(gridGroup);

  var turrets = [];

  this.addTurret = function() {
    var turret = new Turret(canvas, {});
    turrets.push(turret);
    return turret;
  }

  this.exportMap = function() {
    var result = {
      turrets: [],
    };
    for(var i = 0; i < turrets.length; i++) {
      var turret = turrets[i];
      result.turrets.push(turret.toHash());
    }
    return result;
  }

  this.toggleGrid = function() {
    gridGroup.visible = !gridGroup.visible;
    canvas.renderAll();
    return gridGroup.visible;
  }
}

function Game(canvas) {
  var __game = this;

  this.canvas = canvas;

  // game flow control
  var interval = null;
  var updateMs = 20;

  // game state
  var started = false;

  // game artifacts
  var vip;
  var turrets = [];
  var bullets = [];
  var gameState = {
    game: __game,
    vip: vip,
    bullets: bullets,
    turrets: turrets,
    updateMs: updateMs,
  };

  // ==============================================
  // actions that may be invoked directly by the UI
  // ==============================================

  this.run = function(opts) {
    vip = new Vip(canvas, opts);
    turrets.length = 0;
    bullets.length = 0;
    gameState = {
      game: __game,
      vip: vip,
      bullets: bullets,
      turrets: turrets,
      impactables: turrets.concat(vip),
      updateMs: updateMs,
    };

    timeout = setTimeout(gameTick, 0);
    startGame(opts.gameLayout);
  }

  this.stop = function() { canvas.clear(); if(timeout) { clearTimeout(timeout); timeout = null; } }


  // ===================================
  // private functions beyond this point
  // ===================================

  function randInt(exclusiveUpperBound) {
    return Math.floor(Math.random() * exclusiveUpperBound);
  }

  function startGame(gameLayout) {
    console.log("starting game");
    for(var i = 0; i < gameLayout.turrets.length; i++) {
      var turret = new Turret(canvas, gameLayout.turrets[i]);
      turrets.push(turret);
    }
    started = true;
  }

  function gameTick() {
    var nextUpdate = Date.now() + updateMs;

    for(var i = 0; i < bullets.length; i++) {
      var bullet = bullets[i];
      bullet.tick(gameState);
    }

    vip.tick(gameState);
    for(var a in turrets) {
      var turret = turrets[a];
      turret.tick(gameState);
    }
    //var offset = 0;
    for(var idx in turrets) {
      var turret = turrets[idx];
      if(turret.destroyed()) {
        //turrets.splice(idx - offset, 1);
        //offset += 1;
      }
    }

    canvas.renderAll();
    timeout = setTimeout(gameTick, nextUpdate - Date.now());
  }
}

function Bullet(canvas, options) {
  var __bullet = this;
  var canvas = canvas;

  var angle = options.angle;
  var originVelocity = options.originVelocity;
  var x = options.origin.x;
  var y = options.origin.y;
  var mass = options.mass;
  var energy = options.energy;
  var radius = Math.sqrt(mass);
  var rate = energy / mass;
  var bulletLongevity = 2000;
  var expired = false;
  var impacted = false;
  var time = 0;
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

  originVelocity.magnitude * Math.sin(originVelocity.angle)

  var velocity = {
    x: rate * Math.sin(to_rad(angle)) +
        originVelocity.magnitude * Math.sin(originVelocity.angle),
    y: rate * Math.cos(to_rad(angle)) +
        originVelocity.magnitude * Math.cos(originVelocity.angle),
  }

  this.tick = function(gameState) { gameTick(gameState); }
  this.expired = function() { return expired; }
  this.energy = function() { return energy; }
  this.mass = function() { return mass; }
  this.impacted = function() { return impacted; }
  this.image = function() { return image; }
  this.prevPoint = function() { return prevPoint; }
  this.impact = function() { bulletImpact(); }

  function gameTick(gameState) {
    var elapsed = gameState.updateMs;
    var bullet = __bullet;
    time += elapsed;
    if(time - bulletLongevity > 0) {
      expired = true;
      canvas.remove(image);
    }
    else if(!impacted) {
      for(var i = 0; i < gameState.impactables.length; i++) {
        var tgt = gameState.impactables[i];
        if(circlesIntersect(bullet.image(), tgt.image())) {
          tgt.impact({energy: bullet.energy(), mass: bullet.mass() });
          bullet.impact();
          console.log("bullet impacted with " + tgt);
        }
      }
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


  // ===================================
  // private functions beyond this point
  // ===================================

  function makeImpact(opts) {
    var energy = opts['energy'];
    var mass = opts['mass'];
    hp = hp - (energy * mass * mass);
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
