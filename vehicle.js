class Vehicle {
  constructor(x, y) {
    this.pos = createVector(x, y);
    this.vel = p5.Vector.random2D();
    this.acc = createVector(0, 0);
    this.maxSpeed = 5;
    this.maxForce = 0.3;
    this.r = 15;
    this.captureRadius = 40;
    this.wanderTheta = 0;
  }

  applyBehaviors(target, mode = "seek") {
    let force;
    if (mode === "flee") {
      force = this.flee(target);
    } else if (mode === "wander") {
      force = this.wander();
    } else if (mode === "arrive") {
      force = this.arrive(target);
    } else if (target) {
      force = this.seek(target);
    } else {
      force = createVector(0, 0);
    }
    this.applyForce(force);
  }

  seek(target) {
    let desired = p5.Vector.sub(target, this.pos);
    desired.setMag(this.maxSpeed);
    let steer = p5.Vector.sub(desired, this.vel);
    steer.limit(this.maxForce);
    return steer;
  }

  flee(target) {
    return this.seek(target).mult(-1);
  }

  arrive(target) {
    let desired = p5.Vector.sub(target, this.pos);
    let d = desired.mag();
    
    if (d < 100) {
      let m = map(d, 0, 100, 0, this.maxSpeed);
      desired.setMag(m);
    } else {
      desired.setMag(this.maxSpeed);
    }

    let steer = p5.Vector.sub(desired, this.vel);
    steer.limit(this.maxForce);
    return steer;
  }

  wander() {
    let wanderRadius = 50;
    let wanderDistance = 80;
    let change = 0.3;

    if (this.wanderTheta === undefined) this.wanderTheta = random(TWO_PI);
    this.wanderTheta += random(-change, change);

    // 1. Centre du cercle de wander
    let circleCenter = this.vel.copy();
    if (circleCenter.mag() < 0.1) circleCenter = p5.Vector.random2D();
    circleCenter.setMag(wanderDistance);
    this.debugWanderCenter = p5.Vector.add(this.pos, circleCenter);

    // 2. Point sur le cercle
    let h = this.vel.heading();
    let x = wanderRadius * cos(this.wanderTheta + h);
    let y = wanderRadius * sin(this.wanderTheta + h);
    let target = p5.Vector.add(this.debugWanderCenter, createVector(x, y));
    this.debugWanderTarget = target;

    let steer = p5.Vector.sub(target, this.pos);
    steer.limit(this.maxForce);
    return steer;
  }

  applyForce(force) {
    this.acc.add(force);
  }

  update() {
    this.vel.add(this.acc);
    this.vel.limit(this.maxSpeed || 5);
    this.pos.add(this.vel);
    this.acc.set(0, 0);
  }

  show() {
    // Generic display
    stroke(255);
    strokeWeight(2);
    fill(127);
    push();
    translate(this.pos.x, this.pos.y);
    rotate(this.vel.heading());
    triangle(-this.r, -this.r/2, -this.r, this.r/2, this.r, 0);
    pop();
  }

  displayDebug() {
    push();
    // 1. Cercle de Perception / Capture (VERT comme l'image)
    noFill();
    if (this.isFake) fill(0, 255, 0, 20); // Léger remplissage pour les fakes
    stroke(0, 255, 0, 150);
    strokeWeight(2);
    circle(this.pos.x, this.pos.y, this.captureRadius * 2);

    // 2. Projection de la vitesse (Pointillés Blancs)
    let projection = this.vel.copy().setMag(60);
    stroke(255, 150);
    strokeWeight(1);
    drawingContext.setLineDash([5, 5]);
    line(this.pos.x, this.pos.y, this.pos.x + projection.x, this.pos.y + projection.y);
    drawingContext.setLineDash([]);

    // 3. Si on a une cible de Wander ou de Seek
    let target = this.debugWanderTarget || this.currentTarget;
    
    if (target) {
      // Ligne vers la cible (JAUNE comme l'image)
      stroke(255, 255, 0, 200); 
      strokeWeight(2);
      line(this.pos.x, this.pos.y, target.x, target.y);

      // Point Cible (ROUGE comme l'image)
      fill(255, 0, 0);
      noStroke();
      circle(target.x, target.y, 10);
      
      // Si c'est du wander, on dessine aussi le cercle blanc
      if (this.debugWanderCenter) {
        noFill();
        stroke(255, 100);
        strokeWeight(1);
        circle(this.debugWanderCenter.x, this.debugWanderCenter.y, 100); // 100 = wanderRadius * 2
      }
    }

    // 4. Vecteur Vitesse actuel (Blanc)
    stroke(255);
    strokeWeight(3);
    let vLine = this.vel.copy().mult(10);
    line(this.pos.x, this.pos.y, this.pos.x + vLine.x, this.pos.y + vLine.y);
    pop();
  }

  edges() {
    if (typeof constraintMode !== 'undefined' && constraintMode === 'screen') {
      this.checkBoundaries(); // Force douce pour tourner avant le mur
      this.enforceBoundaries(); // Limite dure pour ne jamais sortir (rebond)
      this.wrapped = false;
    } else {
      this.wrapEdges();
    }
  }

  wrapEdges() {
    this.wrapped = false;
    if (this.pos.x > width + this.r) {
      this.pos.x = -this.r;
      this.wrapped = true;
    } else if (this.pos.x < -this.r) {
      this.pos.x = width + this.r;
      this.wrapped = true;
    }
    if (this.pos.y > height + this.r) {
      this.pos.y = -this.r;
      this.wrapped = true;
    } else if (this.pos.y < -this.r) {
      this.pos.y = height + this.r;
      this.wrapped = true;
    }
  }

  // Empêche physiquement de sortir de l'écran (Rebond)
  enforceBoundaries() {
    if (this.pos.x < this.r) {
      this.pos.x = this.r;
      this.vel.x *= -1;
    } else if (this.pos.x > width - this.r) {
      this.pos.x = width - this.r;
      this.vel.x *= -1;
    }

    if (this.pos.y < this.r) {
      this.pos.y = this.r;
      this.vel.y *= -1;
    } else if (this.pos.y > height - this.r) {
      this.pos.y = height - this.r;
      this.vel.y *= -1;
    }
  }

  checkBoundaries() {
    let desired = null;
    let d = 50;

    if (this.pos.x < d) {
      desired = createVector(this.maxSpeed, this.vel.y);
    } else if (this.pos.x > width - d) {
      desired = createVector(-this.maxSpeed, this.vel.y);
    }

    if (this.pos.y < d) {
      desired = createVector(this.vel.x, this.maxSpeed);
    } else if (this.pos.y > height - d) {
      desired = createVector(this.vel.x, -this.maxSpeed);
    }

    if (desired !== null) {
      desired.normalize();
      desired.mult(this.maxSpeed);
      let steer = p5.Vector.sub(desired, this.vel);
      steer.limit(this.maxForce * 1.5);
      this.applyForce(steer);
    }
  }
}