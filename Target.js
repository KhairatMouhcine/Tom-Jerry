class Target extends Vehicle {
  constructor(x, y) {
    super(x, y);
    this.vel = p5.Vector.random2D().mult(2);
    this.maxSpeed = 3;
    this.maxForce = 0.2;
    this.wanderTheta = random(TWO_PI);
    this.color = { r: 255, g: 204, b: 0 };
    this.odorWaves = [];
  }

  update() {
    super.update();
    // Générer des vagues d'odeur
    if (frameCount % 40 === 0) {
      this.odorWaves.push({ r: 0, alpha: 255 });
    }
    for (let i = this.odorWaves.length - 1; i >= 0; i--) {
      this.odorWaves[i].r += 2;
      this.odorWaves[i].alpha -= 3;
      if (this.odorWaves[i].alpha <= 0) this.odorWaves.splice(i, 1);
    }
  }

  show() {
    // 1. Dessiner les vagues d'odeur 🧀💨
    push();
    noFill();
    strokeWeight(2);
    for (let wave of this.odorWaves) {
      stroke(255, 204, 0, wave.alpha);
      circle(this.pos.x, this.pos.y, wave.r);
    }
    pop();

    // 2. Dessiner le fromage 🧀
    push();
    translate(this.pos.x, this.pos.y);
    textAlign(CENTER, CENTER);
    textSize(32);
    text("🧀", 0, 0);
    pop();
  }


}
