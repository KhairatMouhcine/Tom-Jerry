let vehicles = [];
let targets = [];
let vitesseMaxSlider, steeringForceSlider;
let usePlayerControl = true;
let useTargetObject = true;
let frameCounter = 0;
let particles = [];
let score = 0;
let captureRadius = 40;
let bgBuffer;
let isMenuOpen = true;
let constraintMode = 'screen';
let boundary = { x: 0, y: 0, w: 0, h: 0, r: 0 };
let cats = [];
let traps = [];
let scentTrails = [];
const MAX_SCENT_TRAILS = 20; 
let lives = 5;
let fakeMiceCount = 0;
let holes = []; // Nouveau : Les tunnels de souris
let gameOver = false;
let invincibilityTimer = 0;
let catStunTimer = 0;
let isPaused = false;
let debugMode = false;
let gameState = 'START'; // START, LEVEL_SELECT, PLAYING, LEVEL_UP, GAME_OVER, WIN
let currentLevel = 1;
let unlockedLevels = 1; // Par défaut, seul le niveau 1 est débloqué
let cheatCodeBuffer = ""; // Pour stocker les touches tapées pour le cheat code
let levelScore = 0;
let levelTargetScore = 500;
let bgImage;
let isDemoMode = false;
let countdownTimer = 0; // Compte à rebours de début de niveau (en frames)

const levelStyles = [
  { name: "Cuisine en Bois", color: "#2c1e14", floor: "#3d2b1f", pattern: "wood" },
  { name: "Carrelage Gris", color: "#1a1a1a", floor: "#262626", pattern: "tile" },
  { name: "Sol de Marbre", color: "#303030", floor: "#404040", pattern: "marble" },
  { name: "Moquette Rouge", color: "#3d0a0a", floor: "#5a1010", pattern: "dots" },
  { name: "Jardin de Nuit", color: "#0a1a0a", floor: "#102a10", pattern: "grass" },
  { name: "Usine Métal", color: "#1a1c2c", floor: "#292c3d", pattern: "metal" },
  { name: "Chambre Bleue", color: "#0a0a2c", floor: "#15154c", pattern: "stars" },
  { name: "Le Château Noir", color: "#000000", floor: "#111111", pattern: "checkers" }
];

function preload() {
  // Chemin local vers l'image copiée dans le dossier du projet
  bgImage = loadImage('logo_bg.png');
}

// Couleurs thématiques Souris & Fromage
const targetColors = [
  { r: 255, g: 204, b: 0, name: 'EMMENTAL' },
  { r: 255, g: 235, b: 59, name: 'CHEDDAR' },
  { r: 255, g: 193, b: 7, name: 'GOUDA' },
  { r: 255, g: 152, b: 0, name: 'MIMOLETTE' }
];

function setup() {
  createCanvas(windowWidth, windowHeight);
  createBackgroundBuffer();
  createGameUI();
  updateBoundaryDimensions();
  initHoles();
}

function startNewGame() {
  score = 0;
  lives = 5;
  currentLevel = 1;
  startLevel(currentLevel);
  gameState = 'PLAYING';
}

function startLevel(level) {
  levelScore = 0;
  levelTargetScore = level * 500;
  fakeMiceCount = 0;
  lives = 5; // Réinitialiser les vies à chaque niveau
  
  // Vider les anciennes listes
  vehicles = [];
  targets = [];
  cats = [];
  traps = [];
  scentTrails = [];
  
  // Ajouter la souris
  vehicles.push(new Mouse(width/2, height/2));
  
  // Difficulté croissante : Plus de chats et plus vite
  let catCount = 1 + floor((level - 1) / 2);
  for (let i = 0; i < catCount; i++) {
    let c = new Cat(random(width), random(height));
    c.maxSpeed = 4 + (level * 0.3); // Le chat accélère à chaque niveau
    cats.push(c);
  }
  
  // Plus de pièges
  let trapCount = 2 + level;
  for (let i = 0; i < trapCount; i++) {
    let t = {
      pos: createVector(
        random(boundary.x + 50, boundary.x + boundary.w - 50),
        random(boundary.y + 50, boundary.y + boundary.h - 50)
      ),
      vel: createVector(0, 0)
    };
    
    // Niveau 8 : Les pièges se déplacent !
    if (level === 8) {
      t.vel = p5.Vector.random2D().mult(random(2, 5));
    }
    
    traps.push(t);
  }
  
  createNewTarget();
  countdownTimer = 180; // 3 secondes à 60 fps
}

function initHoles() {
  holes = [
    { x: 100, y: 100, color: '#3e2723' },
    { x: width - 100, y: 100, color: '#3e2723' },
    { x: 100, y: height - 100, color: '#3e2723' },
    { x: width - 100, y: height - 100, color: '#3e2723' }
  ];
}

function updateBoundaryDimensions() {
  boundary.w = width * 0.6;
  boundary.h = height * 0.6;
  boundary.x = (width - boundary.w) / 2;
  boundary.y = (height - boundary.h) / 2;
  boundary.r = min(width, height) * 0.3;
  // Pour le cercle, on utilise x,y comme centre
  boundary.cx = width / 2;
  boundary.cy = height / 2;
}

function draw() {
  // Masquer l'interface sur l'accueil et la sélection de niveau
  let hud = select('.top-hud');
  let panel = select('#main-panel');
  if (hud && panel) {
    if (gameState === 'START' || gameState === 'LEVEL_SELECT') {
      hud.style('display', 'none');
      panel.style('display', 'none');
    } else {
      hud.style('display', 'flex');
      panel.style('display', 'block');
    }
  }

  if (gameState === 'START') {
    displayStartScreen();
    return;
  }

  if (isPaused) {
    displayPauseScreen();
    return;
  }
  
  if (gameState === 'GAME_OVER') {
    displayGameOver();
    return;
  }

  if (gameState === 'LEVEL_UP') {
    displayLevelUpScreen();
    return;
  }

  if (gameState === 'LEVEL_SELECT') {
    displayLevelSelect();
    return;
  }

  if (gameState === 'WIN') {
    displayWinScreen();
    return;
  }

  // JEU EN COURS
  drawLevelFloor();

  if (countdownTimer > 0) {
    displayCountdown();
    countdownTimer--;
    // On dessine sans mettre à jour la physique
    drawHoles();
    drawTraps(); 
    for (let t of targets) t.show();
    for (let v of vehicles) v.show();
    for (let c of cats) {
      c.show();
      if (debugMode) c.displayDebug();
    }
    for (let v of vehicles) {
      if (debugMode) v.displayDebug();
    }
    return;
  }

  // Indicateur Mode Démo
  if (isDemoMode) {
    push();
    textAlign(CENTER, TOP);
    textSize(40);
    fill(255, 204, 0, 150 + sin(frameCounter * 0.1) * 50);
    text("🎥 MODE DÉMO (AUTO) 🎥", width/2, 100);
    textSize(20);
    fill(255, 200);
    text("Appuyez sur [R] pour quitter la démo", width/2, 150);
    pop();
  }

  frameCounter++;
  if (invincibilityTimer > 0) invincibilityTimer--;
  if (catStunTimer > 0) catStunTimer--;

  // Dessiner l'espace alloué (Limite)
  drawBoundary();

  adjustVehicleCount();
  updateVehicleParameters();
  updateScents(); 
  updateTargets();
  updateCats();
  updateParticles();
  checkCaptures();
  checkCatCollisions();
  checkTrapCollisions();

  drawHoles();
  drawTraps();
  drawAllTargets();
  updateAndDrawVehicles();

  // Affichage Debug
  if (debugMode) {
    for (let v of vehicles) v.displayDebug();
    for (let c of cats) c.displayDebug();
  }

  updateHUDStats();
}

function drawBoundary() {
  if (constraintMode === 'none') return;

  push();
  noFill();
  // Rouge si debug, jaune sinon
  if (debugMode) {
    stroke(255, 0, 0, 200);
    strokeWeight(2); // Plus fin comme sur l'image
  } else {
    stroke(255, 204, 0, 100);
    strokeWeight(10);
  }
  rect(0, 0, width, height);
  pop();
}

function createBackgroundBuffer() {
  bgBuffer = createGraphics(width, height);
  bgBuffer.background(44, 30, 20);
  bgBuffer.noStroke();
  for (let i = 0; i < 200; i++) {
    bgBuffer.fill(60, 40, 30, 50);
    bgBuffer.circle(random(width), random(height), random(2, 5));
  }
}

function createNewTarget() {
  let col = targetColors[floor(random(targetColors.length))];

  let tx, ty;
  if (constraintMode === 'none') {
    tx = random(width);
    ty = random(height);
  } else if (constraintMode === 'rect') {
    tx = random(boundary.x + 20, boundary.x + boundary.w - 20);
    ty = random(boundary.y + 20, boundary.y + boundary.h - 20);
  } else {
    tx = width / 2 + random(-boundary.r, boundary.r) * 0.5;
    ty = height / 2 + random(-boundary.r, boundary.r) * 0.5;
  }

  if (useTargetObject) {
    let t = new Target(tx, ty);
    t.color = col;
    targets.push(t);
  } else {
    targets.push({ x: mouseX, y: mouseY, color: col, isManual: true });
  }
}

function adjustVehicleCount() {
  // On ne force plus le nombre à 1 pour permettre l'ajout manuel
  if (vehicles.length === 0) {
    vehicles.push(new Mouse(random(width), random(height)));
  }
}

function updateVehicleParameters() {
  for (let v of vehicles) {
    v.maxSpeed = vitesseMaxSlider.value();
    v.maxForce = steeringForceSlider.value();
    v.captureRadius = captureRadius;
  }
}

function updateTargets() {
  if (targets.length === 0) createNewTarget();

  for (let t of targets) {
     if (t.update) {
       t.wander();
       t.update();
       t.edges();
     }
  }
}

function drawAllTargets() {
  for (let t of targets) {
    if (t.show) {
      t.show();
    } else {
      push();
      translate(t.x, t.y);
      textAlign(CENTER, CENTER);
      textSize(32);
      text("🧀", 0, 0);
      noFill();
      stroke(255, 204, 0, 100);
      circle(0, 0, 40 + sin(frameCounter * 0.1) * 10);
      pop();
    }
  }
}

function updateAndDrawVehicles() {
  for (let i = vehicles.length - 1; i >= 0; i--) {
    let v = vehicles[i];

    // Vérifier expiration si c'est une fake
    if (v.isFake && v.isExpired()) {
      createExplosion(v.pos.x, v.pos.y, { r: 0, g: 255, b: 0 }); // Explosion verte
      vehicles.splice(i, 1);
      continue;
    }

    let targetPos = null;

    if (v.isFake) {
      // Les fakes font du WANDER uniquement
      let wanderForce = v.wander();
      v.applyForce(wanderForce);
    } else {
      // Comportement normal pour la souris principale
      if (usePlayerControl) {
        targetPos = createVector(mouseX, mouseY);
        let f = v.seek(targetPos);
        v.applyForce(f);
      } else {
        targetPos = findNearestTarget(v);
        if (targetPos) {
          v.currentTarget = targetPos; // Pour le debug
          let seekForce = v.seek(targetPos);
          v.applyForce(seekForce);
        } else {
          v.currentTarget = null;
        }
      }
    }

    if (usePlayerControl && !v.isFake) {
       v.currentTarget = targetPos; // Pour le debug en mode manuel
    }

    // EVITEMENT DU CHAT ET PIÈGES
    let shouldAvoid = v.isFake || !usePlayerControl;

    if (shouldAvoid) {
      for (let cat of cats) {
        let d = dist(v.pos.x, v.pos.y, cat.pos.x, cat.pos.y);
        if (d < 150) { 
          let fleeForce = v.flee(cat.pos);
          fleeForce.mult(3.0); 
          v.applyForce(fleeForce);
        }
      }

      for (let trap of traps) {
        let d = dist(v.pos.x, v.pos.y, trap.pos.x, trap.pos.y);
        if (d < 80) { 
          let fleeForce = v.flee(trap.pos);
          fleeForce.mult(2.0);
          v.applyForce(fleeForce);
        }
      }
    }

    // Traces odorantes (Uniquement pour les vraies souris)
    if (!v.isFake && frameCounter % 15 === 0) {
      scentTrails.push({ pos: v.pos.copy(), life: 255 });
      if (scentTrails.length > MAX_SCENT_TRAILS) scentTrails.shift();
    }

    v.update();
    v.edges(); 

    // TELEPORTATION PAR LES TROUS
    checkHoleTeleport(v);

    v.show();
  }
}

function checkHoleTeleport(v) {
  // Initialiser le cooldown si inexistant
  if (v.holeCooldown === undefined) v.holeCooldown = 0;
  if (v.holeCooldown > 0) {
    v.holeCooldown--;
    return;
  }

  for (let i = 0; i < holes.length; i++) {
    let h = holes[i];
    let d = dist(v.pos.x, v.pos.y, h.x, h.y);
    
    if (d < 30) {
      // Choisir un autre trou au hasard
      let otherHoles = holes.filter((_, idx) => idx !== i);
      let destination = random(otherHoles);
      
      // Effet visuel
      createExplosion(v.pos.x, v.pos.y, { r: 60, g: 40, b: 30 });
      
      // Téléporter
      v.pos.x = destination.x;
      v.pos.y = destination.y;
      v.history = []; // Vider la traîne pour éviter le trait géant
      v.holeCooldown = 60; // 1 seconde de pause avant de pouvoir repartir
      
      createTextPopup("ZIP!", v.pos.x, v.pos.y);
      break;
    }
  }
}

function drawHoles() {
  for (let h of holes) {
    push();
    translate(h.x, h.y);
    
    // 1. Cercle de base (l'autocollant)
    noStroke();
    fill(40, 30, 20); // Fond très sombre
    ellipse(0, 0, 70, 50);

    // 2. L'effet de "porte" creusée (style décalcomanie)
    fill(10, 5, 0); // Le noir profond
    ellipse(0, 0, 60, 42);

    // 3. Petite lumière au fond pour donner du relief (3D accent)
    fill(255, 255, 255, 15);
    arc(0, 5, 50, 25, 0, PI);

    // 4. Cadre "Sticker" (bordure blanche/beige typique des accents muraux)
    noFill();
    stroke(245, 230, 200); 
    strokeWeight(3);
    arc(0, 0, 65, 48, PI, TWO_PI);
    line(-32.5, 0, 32.5, 0);

    // 5. LE DÉTAIL "TOM & JERRY" : Deux petits yeux qui brillent au fond
    // On les fait cligner légèrement avec le frameCounter
    if (floor(frameCounter / 30) % 5 !== 0) { 
      fill(255, 255, 100); // Jaune brillant
      circle(-8, -5, 4);
      circle(8, -5, 4);
    }
    
    // 6. Quelques moustaches qui dépassent (pour le côté accent)
    stroke(255, 255, 255, 80);
    strokeWeight(1);
    line(-35, -5, -50, -10);
    line(-35, 0, -52, 0);
    line(35, -5, 50, -10);
    line(35, 0, 52, 0);

    pop();
  }
}

function findNearestTarget(v) {
  if (targets.length === 0) return null;
  let nearest = null;
  let minDist = Infinity;
  for (let t of targets) {
    let tx = t.x !== undefined ? t.x : t.pos.x;
    let ty = t.y !== undefined ? t.y : t.pos.y;
    let d = dist(v.pos.x, v.pos.y, tx, ty);
    if (d < minDist) {
      minDist = d;
      nearest = createVector(tx, ty);
    }
  }
  return nearest;
}

function checkCaptures() {
  for (let i = targets.length - 1; i >= 0; i--) {
    let t = targets[i];
    if (t.isManual) continue; 

    let tx = t.x !== undefined ? t.x : t.pos.x;
    let ty = t.y !== undefined ? t.y : t.pos.y;

    for (let v of vehicles) {
      if (dist(v.pos.x, v.pos.y, tx, ty) < captureRadius) {
        createExplosion(tx, ty, { r: 255, g: 204, b: 0 });
        targets.splice(i, 1);
        score += 100;
        levelScore += 100;
        
        // Progression Niveau (Désactivée en mode Démo)
        if (!isDemoMode && levelScore >= levelTargetScore) {
          if (currentLevel < 8) {
            if (unlockedLevels <= currentLevel) unlockedLevels = currentLevel + 1;
            gameState = 'LEVEL_UP';
          } else {
            gameState = 'WIN';
          }
        }

        if (targets.length === 0) createNewTarget();
       
        break;
      }
    }
  }
  // Régénération automatique si besoin
  if (targets.length === 0 && !usePlayerControl) createNewTarget();
}

function createExplosion(x, y, col) {
  for (let i = 0; i < 15; i++) particles.push(new Particle(x, y, "crumb", col));
  for (let i = 0; i < 20; i++) particles.push(new Particle(x, y, "confetti"));
  for (let i = 0; i < 3; i++) particles.push(new Particle(x, y, "emoji"));
}

function updateParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    particles[i].update();
    particles[i].show();
    if (particles[i].isDead()) particles.splice(i, 1);
  }
}

function updateCats() {
  for (let i = 0; i < cats.length; i++) {
    let cat = cats[i];

    if (i === 0) {
      // LE CHASSEUR (Stalker) : Suit la souris ou les leurres
      let target = null;
      let minDist = Infinity;
      let isChasingFake = false;

      for (let v of vehicles) {
        if (!v) continue;
        let d = dist(cat.pos.x, cat.pos.y, v.pos.x, v.pos.y);
        let effectiveDist = v.isFake ? d * 0.5 : d; 

        if (effectiveDist < minDist) {
          minDist = effectiveDist;
          target = v;
          isChasingFake = v.isFake;
        }
      }

      if (target) {
        cat.currentTarget = target.pos;
        let seekForce = cat.seek(target.pos);
        cat.applyForce(seekForce);
        
        if (isChasingFake) {
          push();
          translate(cat.pos.x, cat.pos.y - cat.r - 10);
          textAlign(CENTER);
          textSize(24);
          text("❓", 0, 0);
          pop();
        }
      }
    } else {
      // LES FLÂNEURS (Wanderers) : Se baladent aléatoirement
      let wanderForce = cat.wander();
      cat.applyForce(wanderForce);
      cat.currentTarget = cat.debugWanderTarget; // Pour le debug
    }

    cat.update();
    cat.edges();
    cat.show();
    
    if (debugMode) {
      cat.displayDebug();
    }
  }
}

function updateScents() {
  for (let i = scentTrails.length - 1; i >= 0; i--) {
    let s = scentTrails[i];
    s.life -= 3; // Disparition un peu plus rapide
    
    // Draw
    noStroke();
    fill(150, 150, 150, s.life * 0.5); 
    textSize(32);
    textAlign(CENTER);
    text("🐾", s.pos.x, s.pos.y);

    if (s.life <= 0) {
      scentTrails.splice(i, 1);
    }
  }
}

function drawTraps() {
  for (let t of traps) {
    // Si niveau 8, on met à jour la position
    if (currentLevel === 8 && countdownTimer === 0) {
      t.pos.add(t.vel);
      
      // Rebondir sur les bords de la boundary
      if (t.pos.x < boundary.x || t.pos.x > boundary.x + boundary.w) t.vel.x *= -1;
      if (t.pos.y < boundary.y || t.pos.y > boundary.y + boundary.h) t.vel.y *= -1;
    }

    push();
    translate(t.pos.x, t.pos.y);
    textAlign(CENTER, CENTER);
    textSize(40);
    text("🪤", 0, 0);
    pop();
  }
}

function checkTrapCollisions() {
  if (invincibilityTimer > 0) return;

  for (let i = vehicles.length - 1; i >= 0; i--) {
    let v = vehicles[i];
    for (let t of traps) {
      let d = dist(v.pos.x, v.pos.y, t.pos.x, t.pos.y);
      if (d < 30) {
        lives--;
        invincibilityTimer = 60;
        
        // Effet visuel du piège qui claque
        createExplosion(v.pos.x, v.pos.y, { r: 150, g: 150, b: 150 });
        particles.push(new Particle(t.pos.x, t.pos.y, "emoji", { r: 255, g: 0, b: 0 }, "💥"));
        
        // Message visuel
        createTextPopup("SNAP!", t.pos.x, t.pos.y);
        
        // Respawn loin du piège
        v.pos.x = random(width);
        v.pos.y = random(height);
        v.history = [];
        
        if (lives <= 0) {
          gameState = 'GAME_OVER';
        }
        break;
      }
    }
  }
}

function createTextPopup(txt, x, y) {
  // On utilise le système de particules pour afficher du texte temporaire
  particles.push({
    pos: createVector(x, y),
    vel: createVector(0, -2),
    alpha: 255,
    txt: txt,
    update: function() {
      this.pos.add(this.vel);
      this.alpha -= 5;
    },
    show: function() {
      push();
      translate(this.pos.x, this.pos.y);
      textAlign(CENTER, CENTER);
      textSize(32);
      fill(255, this.alpha);
      stroke(0, this.alpha);
      strokeWeight(4);
      text(this.txt, 0, 0);
      pop();
    },
    isDead: function() { return this.alpha <= 0; }
  });
}

function checkCatCollisions() {
  if (invincibilityTimer > 0) return;

  for (let cat of cats) {
    for (let i = vehicles.length - 1; i >= 0; i--) {
      let v = vehicles[i];
      if (!v) continue;
      
      let d = dist(cat.pos.x, cat.pos.y, v.pos.x, v.pos.y);
      if (d < cat.r + v.r - 5) { 
        lives--;
        invincibilityTimer = 60; // 1s invincibility
        createExplosion(v.pos.x, v.pos.y, { r: 255, g: 50, b: 50 }); 
        
        // Risky respawn away from danger
        v.pos.x = (cat.pos.x + width/2) % width;
        v.pos.y = (cat.pos.y + height/2) % height;
        v.history = []; 
        
        if (lives <= 0) {
          gameState = 'GAME_OVER';
        }
      }
    }
  }
}

function displayGameOver() {
  push();
  background(0, 200);
  fill(255);
  textAlign(CENTER, CENTER);
  
  fill(255, 50, 50);
  textSize(80);
  text("GAME OVER", width/2, height/2 - 60);
  
  fill(255);
  textSize(32);
  text(`Score Total: ${score}`, width/2, height/2 + 10);
  text(`Niveau atteint: ${currentLevel}`, width/2, height/2 + 50);
  
  textSize(24);
  fill(255, 204, 0);
  text("Appuyez sur R pour retenter votre chance", width/2, height/2 + 120);
  pop();
}

function displayStartScreen() {
  background(20, 15, 10); // Fond brun foncé par défaut (couleur souris)
  
  if (bgImage) {
    push();
    imageMode(CORNER);
    image(bgImage, 0, 0, width, height);
    pop();
  }
  
  push();
  // Overlay pour lisibilité
  fill(0, 160);
  rect(0, 0, width, height);
  
  textAlign(CENTER, CENTER);
  
  // Titre principal
  textSize(120);
  fill(255, 204, 0); 
  stroke(0);
  strokeWeight(10);
  text("MOUSE CHASE", width/2, height/3);
  
  // Sous-titre
  noStroke();
  fill(255);
  textSize(28);
  text("L'ESQUIVE ULTIME DANS LA CUISINE", width/2, height/3 + 80);
  
  // Instructions encadrées
  fill(255, 230, 150, 200);
  textSize(22);
  let inst = "Déplacez votre SOURIS pour diriger Jerry • Mangez le fromage\nÉvitez les chats et les pièges !";
  text(inst, width/2, height/2 + 60);
  
  // Bouton d'action
  let pulse = sin(frameCounter * 0.1) * 10;
  fill(255, 255, 255, 200 + pulse * 5);
  textSize(36);
  text("APPUYEZ SUR [ENTRÉE] POUR COMMENCER", width/2, height - 150);
  
  pop();
}

function displayLevelUpScreen() {
  push();
  background(0, 150);
  textAlign(CENTER, CENTER);
  
  fill(255, 204, 0);
  textSize(60);
  text(`NIVEAU ${currentLevel} COMPLÉTÉ !`, width/2, height/2 - 50);
  
  fill(255);
  textSize(24);
  text("Le chat devient plus rapide...", width/2, height/2 + 20);
  
  fill(255, 230, 100);
  textSize(32);
  text("APPUYEZ SUR [ENTRÉE] POUR LE NIVEAU SUIVANT", width/2, height/2 + 100);
  pop();
}

function displayCountdown() {
  push();
  // Animation de pulse basée sur le temps restant
  let currentSec = ceil(countdownTimer / 60);
  let pulse = (countdownTimer % 60) / 60; // De 1 à 0
  
  textAlign(CENTER, CENTER);
  
  // Ombre portée
  fill(0, 100);
  textSize(160 * (1 + pulse * 0.5));
  text(currentSec, width/2 + 5, height/2 + 5);
  
  // Chiffre principal
  fill(255, 204, 0);
  stroke(255);
  strokeWeight(4);
  text(currentSec, width/2, height/2);
  
  // Message
  noStroke();
  fill(255);
  textSize(32);
  text("PRÉPAREZ-VOUS !", width/2, height/2 + 150);
  pop();
}

function displayWinScreen() {
  push();
  background(0, 200);
  textAlign(CENTER, CENTER);
  
  fill(255, 204, 0);
  textSize(80);
  text("VICTOIRE TOTALE !", width/2, height/2 - 50);
  
  fill(255);
  textSize(30);
  text(`Félicitations ! Vous avez survécu aux 8 niveaux.\nScore Final: ${score}`, width/2, height/2 + 40);
  
  fill(255, 230, 100);
  textSize(32);
  text("APPUYEZ SUR [R] POUR RECOMMENCER", width/2, height/2 + 150);
  pop();
}

function displayLevelSelect() {
  background(20, 15, 10);
  if (bgImage) {
    push();
    imageMode(CORNER);
    tint(255, 100);
    image(bgImage, 0, 0, width, height);
    pop();
  }
  
  push();
  textAlign(CENTER, CENTER);
  fill(255, 204, 0);
  textSize(60);
  text("SÉLECTION DU NIVEAU", width/2, 100);
  
  let cols = 4;
  let size = 120;
  let gap = 40;
  let startX = width/2 - (cols * size + (cols-1) * gap)/2 + size/2;
  let startY = height/2 - size/2;
  
  for (let i = 0; i < 8; i++) {
    let row = floor(i / cols);
    let col = i % cols;
    let x = startX + col * (size + gap);
    let y = startY + row * (size + gap);
    
    let isLocked = (i + 1) > unlockedLevels;
    
    // Dessiner bouton
    strokeWeight(4);
    if (isLocked) {
      fill(50, 50, 50);
      stroke(100);
    } else {
      let isHover = dist(mouseX, mouseY, x, y) < size/2;
      fill(isHover ? "#ffcc00" : "#8b4513");
      stroke(isHover ? "#fff" : "#ffcc00");
      if (isHover && mouseIsPressed) {
        currentLevel = i + 1;
        startLevel(currentLevel);
        gameState = 'PLAYING';
      }
    }
    
    rectMode(CENTER);
    square(x, y, size, 20);
    
    fill(255);
    noStroke();
    textSize(32);
    if (isLocked) {
      text("🔒", x, y);
    } else {
      text(i + 1, x, y);
      textSize(12);
      text(levelStyles[i].name, x, y + size/2 + 15);
    }
  }
  
  textSize(20);
  fill(200);
  text("Cliquez sur un niveau débloqué pour commencer", width/2, height - 70);

  // SECTION DEMO / INSTRUCTIONS (COMMENT JOUER)
  drawHowToPlayDemo(width/2, height - 190);
  
  pop();
}

function drawHowToPlayDemo(x, y) {
  push();
  translate(x, y);
  
  // 1. Titre centré au-dessus de la barre
  textAlign(CENTER, CENTER);
  textSize(22);
  fill(255, 204, 0);
  text("COMMENT JOUER :", 0, -85);

  // 2. Fond translucide pour la barre d'action
  fill(255, 25);
  rectMode(CENTER);
  noStroke();
  rect(0, 0, 950, 130, 20);
  
  // Configuration des colonnes (5 colonnes)
  let startX = -380;
  let spacing = 190;

  // Item 1 : Direction
  drawHowToItem(startX, 0, "🖱️", "SÉLECTIONNER\n& DIRIGER");

  // Item 2 : Leurre
  drawHowToItem(startX + spacing, 0, "⌨️ [S]", "ACTIVER\nUN LEURRE");

  // Item 3 : Trous
  drawHowToItem(startX + spacing * 2, 0, "🕳️", "TUNNEL\n(ZIP!)");

  // Item 4 : Fromage
  drawHowToItem(startX + spacing * 3, 0, "🧀", "MANGEZ DU\nFROMAGE");

  // Item 5 : BOUTON DÉMO (Cliquable)
  let dx = startX + spacing * 4;
  let isHoverDemo = dist(mouseX, mouseY, x + dx, y) < 60;
  
  if (isHoverDemo) {
    fill(255, 0, 0, 200);
    rect(dx, 0, 140, 100, 15);
    cursor(HAND);
    if (mouseIsPressed) {
      isDemoMode = true;
      usePlayerControl = false;
      currentLevel = 1;
      startLevel(1);
      gameState = 'PLAYING';
    }
  } else {
    fill(255, 0, 0, 100);
    rect(dx, 0, 140, 100, 15);
  }
  
  drawHowToItem(dx, 0, "🎥", "VOIR UNE\nDÉMO AUTO");
  
  pop();
}

function drawHowToItem(tx, ty, emoji, desc) {
  push();
  translate(tx, ty);
  textAlign(CENTER, CENTER);
  // Emoji
  textSize(28);
  fill(255);
  text(emoji, 0, -15);
  // Description
  textSize(12);
  fill(255);
  text(desc, 0, 30);
  pop();
}

function drawLevelFloor() {
  let style = levelStyles[currentLevel - 1];
  background(style.color);
  
  // Dessiner un motif léger au sol
  push();
  stroke(style.floor);
  strokeWeight(1);
  let step = 50;
  
  if (style.pattern === "wood") {
    for (let x = 0; x < width; x += step) line(x, 0, x, height);
  } else if (style.pattern === "tile") {
    for (let x = 0; x < width; x += step) line(x, 0, x, height);
    for (let y = 0; y < height; y += step) line(0, y, width, y);
  } else if (style.pattern === "dots") {
    noStroke();
    fill(style.floor);
    for (let x = 25; x < width; x += step) {
      for (let y = 25; y < height; y += step) circle(x, y, 4);
    }
  } else if (style.pattern === "stars") {
    noStroke();
    fill(255, 100);
    for (let i = 0; i < 100; i++) {
        let xValue = (noise(i, frameCounter*0.005) * width);
        let yValue = (noise(i+50, frameCounter*0.005) * height);
        circle(xValue, yValue, 2);
    }
  } else if (style.pattern === "checkers") {
    noStroke();
    fill(style.floor);
    for (let x = 0; x < width; x += step*2) {
      for (let y = 0; y < height; y += step*2) {
        rect(x, y, step, step);
        rect(x+step, y+step, step, step);
      }
    }
  }
  pop();
}

function displayPauseScreen() {
  push();
  background(0, 100);
  fill(255);
  textAlign(CENTER, CENTER);
  textSize(64);
  text("PAUSE", width/2, height/2);
  textSize(24);
  text("Appuyez sur P pour reprendre", width/2, height/2 + 50);
  pop();
}

function createGameUI() {
  createTopHUD();
  createUnifiedControlPanel();
}

function createTopHUD() {
  let hud = createDiv('').class('top-hud');
  createDiv('🧀 MOUSE CHASE 🐁').class('game-title').parent(hud);
  let stats = createDiv('').class('stats-display').parent(hud);
  createStatItem(stats, 'NIVEAU', 'level-val', '1');
  createStatItem(stats, 'SCORE', 'score-val', '0');
  createStatItem(stats, 'LEURRES', 'fake-val', '0 / 3');
  createStatItem(stats, 'VIES', 'lives-val', '❤️❤️❤️❤️❤️');
  createStatItem(stats, 'OBJECTIF', 'target-val', '0 / 500');
}

function createStatItem(p, label, id, val) {
  let i = createDiv('').class('stat-item').parent(p);
  createDiv(label).class('stat-label').parent(i);
  createDiv(val).class('stat-value').id(id).parent(i);
}

function createUnifiedControlPanel() {
  let p = createDiv('').id('main-panel').class('control-panel');

  // Sliders cachés pour ne pas casser la logique existante sans tout refactoriser
  let hiddenContainer = createDiv('').style('display', 'none').parent(p);
  vitesseMaxSlider = createSlider(1, 20, 10, 1).parent(hiddenContainer);
  steeringForceSlider = createSlider(0.1, 2, 0.4, 0.1).parent(hiddenContainer);

  let toggleBtn = createButton('▶');
  toggleBtn.class('panel-toggle-btn');
  toggleBtn.parent(p);
  toggleBtn.mousePressed(() => {
    isMenuOpen = !isMenuOpen;
    if (isMenuOpen) {
      p.removeClass('minimized');
      toggleBtn.html('▶');
    } else {
      p.addClass('minimized');
      toggleBtn.html('◀');
    }
  });

  let h = createDiv('').class('panel-header').parent(p);
  createSpan('⌨️').class('panel-icon').parent(h);
  createSpan('COMMANDES').class('panel-title').parent(h);

  let b = createDiv('').class('panel-body').parent(p);
  
  createControlItem(b, 'ENTRÉE', 'COMMENCER / SUIVANT');
  createControlItem(b, 'S', 'LEURRE SOURIS (3 Max)');
  createControlItem(b, 'P', 'PAUSE');
  createControlItem(b, 'D', 'MODE DEBUG');
  createControlItem(b, 'Q', 'QUITTER LE NIVEAU');
  createControlItem(b, 'R', 'RÉINITIALISER');
}

function createControlItem(p, k, d) {
  let i = createDiv('').class('control-item').parent(p);
  createSpan(k).class('key-badge').parent(i);
  createSpan(d).parent(i);
}

function updateHUDStats() {
  select('#score-val').html(score);
  select('#level-val').html(currentLevel);
  select('#target-val').html(`${levelScore} / ${levelTargetScore}`);
  select('#fake-val').html(`${fakeMiceCount} / 3`);
  
  if (select('#lives-val')) {
    let hearts = "";
    for(let i=0; i<lives; i++) hearts += "❤️";
    for(let i=lives; i<5; i++) hearts += "🖤";
    select('#lives-val').html(hearts);
  }
}

function keyPressed() {
  if (gameState === 'START' && keyCode === ENTER) {
    gameState = 'LEVEL_SELECT';
  }

  if (gameState === 'LEVEL_UP' && keyCode === ENTER) {
    currentLevel++;
    if (currentLevel > unlockedLevels) unlockedLevels = currentLevel;
    startLevel(currentLevel);
    gameState = 'PLAYING';
  }

  if (key === 's' || key === 'S') {
    if (fakeMiceCount < 3) {
      vehicles.push(new FakeMouse(random(width), random(height)));
      fakeMiceCount++;
      createTextPopup("LEURRE ACTIVÉ!", width/2, height/2);
    } else {
      createTextPopup("PLUS DE LEURRES!", width/2, height/2);
    }
  }
  if (key === 'p' || key === 'P') {
    isPaused = !isPaused;
  }
  if (key === 'd' || key === 'D') {
    debugMode = !debugMode;
  }
  if (key === 'q' || key === 'Q') {
    isDemoMode = false;
    usePlayerControl = true;
    gameState = 'LEVEL_SELECT';
  }
  if ((key === 'r' || key === 'R')) {
    score = 0;
    lives = 5;
    fakeMiceCount = 0;
    // On ne réinitialise JAMAIS unlockedLevels ici
    isDemoMode = false;
    usePlayerControl = true;
    gameState = 'LEVEL_SELECT';
  }

  // GESTION DU CHEAT CODE "EMSI"
  cheatCodeBuffer += key.toUpperCase();
  if (cheatCodeBuffer.length > 4) {
    cheatCodeBuffer = cheatCodeBuffer.substring(cheatCodeBuffer.length - 4);
  }

  if (cheatCodeBuffer === "EMSI") {
    unlockedLevels = 8;
    createTextPopup("CHEAT ACTIVÉ : TOUS LES NIVEAUX DÉBLOQUÉS !", width/2, height/2);
    cheatCodeBuffer = ""; // Réinitialiser après activation
  }
}

function mousePressed() {
  // Les pièges ne sont plus ajoutés au clic
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  createBackgroundBuffer();
  updateBoundaryDimensions();
}

class Particle {
  constructor(x, y, type, col = { r: 255, g: 204, b: 0 }) {
    this.pos = createVector(x, y);
    this.type = type; // "crumb", "confetti", "emoji"
    this.vel = p5.Vector.random2D().mult(random(2, 6));
    this.alpha = 255;
    this.rot = random(TWO_PI);
    this.rotSpeed = random(-0.1, 0.1);

    if (this.type === "confetti") {
      let colors = [
        { r: 255, g: 50, b: 50 }, { r: 50, g: 255, b: 50 }, { r: 50, g: 50, b: 255 },
        { r: 255, g: 255, b: 50 }, { r: 255, g: 50, b: 255 }
      ];
      this.col = random(colors);
      this.size = random(5, 10);
    } else if (this.type === "emoji") {
      this.size = random(30, 45);
      this.vel = createVector(random(-2, 2), random(-5, -8));
    } else {
      this.col = col;
      this.size = random(3, 6);
    }
  }

  update() {
    this.pos.add(this.vel);
    this.vel.y += 0.1;
    this.alpha -= 4;
    this.rot += this.rotSpeed;
  }

  show() {
    push();
    translate(this.pos.x, this.pos.y);
    rotate(this.rot);
    noStroke();
    if (this.type === "emoji") {
      textSize(this.size);
      textAlign(CENTER, CENTER);
      fill(255, this.alpha);
      text("🎉", 0, 0);
    } else if (this.type === "confetti") {
      fill(this.col.r, this.col.g, this.col.b, this.alpha);
      rect(0, 0, this.size, this.size / 2);
    } else {
      fill(this.col.r, this.col.g, this.col.b, this.alpha);
      rect(0, 0, this.size, this.size);
    }
    pop();
  }
  isDead() { return this.alpha <= 0; }
}
