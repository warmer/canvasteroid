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
          console.log("bullet impacted with ");
          console.log(tgt);
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

