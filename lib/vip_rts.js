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
    startGame(opts.gameLayout);
    gameState = {
      game: __game,
      vip: vip,
      bullets: bullets,
      turrets: turrets,
      impactables: turrets.concat(vip),
      updateMs: updateMs,
    };

    timeout = setTimeout(gameTick, 0);
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

    var offset = 0;
    for(var i = 0; i < bullets.length; i++) {
      var bullet = bullets[i];
      bullet.tick(gameState);
      // remove impacted bullets
      if (bullet.impacted()) {
        bullets.splice(i - offset, 1);
        offset += 1;
      }
    }

    vip.tick(gameState);
    for(var a in turrets) {
      var turret = turrets[a];
      turret.tick(gameState);
    }

    // keep playing for as long as the VIP is not destroyed
    if (vip.destroyed()) {
      console.log('Game over!');
      var fontSize = 100;
      var text = new fabric.Text('GAME OVER', {
        left: 100, top: (canvas.height - fontSize) / 2, fontSize: fontSize,
        fill: '#f00',
      });
      canvas.add(text);
    } else {
      timeout = setTimeout(gameTick, nextUpdate - Date.now());
    }
    canvas.renderAll();
  }
}
