class FakeMouse extends Mouse {
  constructor(x, y) {
    super(x, y);
    this.spawnTime = millis();
    this.lifetime = 7000; // 7 secondes en millisecondes
    this.isFake = true;
  }

  update() {
    super.update();
  }

  show() {
    // 1. Dessiner le corps de serpent (queue de la souris)
    push();
    noFill();
    stroke(180, 180, 180, 150);
    strokeWeight(4);
    beginShape();
    for (let i = 0; i < this.history.length; i++) {
      let pos = this.history[i];
      vertex(pos.x, pos.y);
    }
    endShape();
    pop();

    // 2. Aura verte forte pour montrer qu'elle est "fake"
    push();
    noFill();
    let smellSize = this.captureRadius * 2 + sin(this.smellAnim) * 10;
    stroke(0, 255, 0, 150); // Vert vif
    strokeWeight(4);
    // On dessine l'aura
    circle(this.pos.x, this.pos.y, smellSize);
    
    // Remplissage vert translucide pour bien la distinguer
    fill(0, 255, 0, 40);
    noStroke();
    circle(this.pos.x, this.pos.y, this.r * 2.5);
    pop();

    // 3. Dessiner la souris 🐁
    push();
    translate(this.pos.x, this.pos.y);
    rotate(this.vel.heading() + PI / 2);
    textAlign(CENTER, CENTER);
    textSize(this.r * 2);
    text("🐁", 0, 0);
    pop();
  }

  isExpired() {
    return (millis() - this.spawnTime > this.lifetime);
  }
}
