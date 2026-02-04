class Mouse extends Vehicle {
  constructor(x, y) {
    super(x, y);
    // Pour l'effet serpent (trail)
    this.history = [];
    this.historyMaxLength = 10;

    // Animation de respiration pour l'odorat
    this.smellAnim = 0;
  }

  update() {
    super.update();

    // Enregistrer l'historique pour le corps de serpent
    this.history.push(this.pos.copy());
    if (this.history.length > this.historyMaxLength) {
      this.history.splice(0, 1);
    }

    // Update l'animation d'odorat
    this.smellAnim += 0.1;
  }

  show() {
    // 1. Dessiner le corps de serpent (queue de la souris)
    push();
    noFill();
    stroke(180, 180, 180, 150); // Gris clair pour la queue
    strokeWeight(4);
    beginShape();
    for (let i = 0; i < this.history.length; i++) {
      let pos = this.history[i];
      vertex(pos.x, pos.y);
    }
    endShape();
    pop();

    // 2. Dessiner le cercle d'odorat (respiration)
    push();
    noFill();
    let smellSize = this.captureRadius * 2 + sin(this.smellAnim) * 10;
    stroke(255, 230, 0, 50); // Aura jaune comme une odeur de fromage qu'on respire
    strokeWeight(2);
    circle(this.pos.x, this.pos.y, smellSize);
    pop();

    // 3. Dessiner la souris 🐁
    push();
    translate(this.pos.x, this.pos.y);
    rotate(this.vel.heading() + PI / 2); // Réajuster l'orientation de l'émoji
    textAlign(CENTER, CENTER);
    textSize(this.r * 2);
    text("🐁", 0, 0);
    pop();
  }

  edges() {
    super.edges();
    if (this.wrapped) {
      this.history = [];
    }
  }
}


