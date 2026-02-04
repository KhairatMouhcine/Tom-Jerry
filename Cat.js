class Cat extends Vehicle {
  constructor(x, y) {
    super(x, y);
    this.maxSpeed = 7; // Plus rapide que la souris
    this.maxForce = 0.4; // Plus vif
    this.r = 25; // Plus gros que la souris
  }

  show() {
    push();
    translate(this.pos.x, this.pos.y);
    // Le chat ne tourne pas forcément visuellement comme une flèche, 
    // mais on peut l'orienter ou juste le dessiner droit.
    // Orientons-le pour qu'il regarde où il va.
    // scale management removed for stability
    textAlign(CENTER, CENTER);
    textSize(this.r * 2);
    text("🐈", 0, 0);
    
    // Debug: cercle de collision
    // noFill();
    // stroke(255, 0, 0);
    // circle(0, 0, this.r * 2);
    pop();
  }

  // Le chat hérite de Vehicle, donc il a déjà edges() qui utilise le mode 'screen' par défaut
}
