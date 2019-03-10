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

  var hp = 100000;
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
    if(!destroyed) {
      tryToFire(gameState);
    }
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
      rect.setGradient('fill', {
        x1: 0, y1: 0, x2: 0, y2: rect.height,
        colorStops: {
          0.0: '#000',
          1.0: '#000',
        },
      });

      //canvas.remove(group);
    }
  }
}

