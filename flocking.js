// --- CONFIGURATION (Tuned for a Professional Look) ---
const NUM_BOIDS = window.innerWidth <= 600 ? 20 : 100; // Reduced to 20 boids for mobile
const MAX_SPEED = 1.5;
const MAX_FORCE = 0.028;
const BOID_SIZE = 9;
const QUADTREE_CAPACITY = 4;

// Plexus Effect
const CONNECTION_RADIUS = 100;

// Aesthetics
const FADE_IN_DURATION = 180; // in frames (approx. 3 seconds)
const USE_MOTION_TRAILS = false;
const NUM_STARS = window.innerWidth <= 600 ? 90 : 220;
const NUM_ORBS = window.innerWidth <= 600 ? 2 : 4;

const themes = {
  dark: {
    boidColor: [205, 214, 244],
    lineColor: [137, 180, 250],
    backgroundColor: [30, 30, 46],
    backgroundAlpha: 10,
    starColor: [238, 244, 255],
    orbColor: [130, 165, 255],
    nebulaColor: [110, 90, 170],
    birdAlphaScale: 1.0,
    birdStride: 1,
    birdSizeScale: 1.0,
    trailAlphaScale: 1.0,
    haloAlphaScale: 1.0,
    coreAlphaScale: 1.0,
    connectionAlphaScale: 1.0,
    starIntensity: 1.0,
    orbIntensity: 1.0,
    localConnectionRadius: 100
  },
  light: {
    boidColor: [88, 110, 117],
    lineColor: [38, 139, 210],
    backgroundColor: [253, 246, 227],
    backgroundAlpha: 15,
    starColor: [72, 88, 120],
    orbColor: [112, 160, 214],
    nebulaColor: [118, 102, 168],
    birdAlphaScale: 0.78,
    birdStride: 1,
    birdSizeScale: 0.9,
    trailAlphaScale: 0.82,
    haloAlphaScale: 0.9,
    coreAlphaScale: 0.95,
    connectionAlphaScale: 0.62,
    starIntensity: 1.22,
    orbIntensity: 1.05,
    localConnectionRadius: 82
  },
  glass: {
    boidColor: [230, 220, 245],
    lineColor: [200, 190, 220],
    backgroundColor: [30, 30, 50],
    backgroundAlpha: 8,
    starColor: [233, 224, 250],
    orbColor: [178, 160, 220],
    nebulaColor: [108, 87, 157],
    birdAlphaScale: 0.75,
    birdStride: 1,
    birdSizeScale: 0.92,
    trailAlphaScale: 0.9,
    haloAlphaScale: 0.95,
    coreAlphaScale: 0.95,
    connectionAlphaScale: 0.72,
    starIntensity: 0.85,
    orbIntensity: 0.85,
    localConnectionRadius: 92
  },
  matrix: {
    boidColor: [0, 255, 70],
    lineColor: [0, 180, 60],
    backgroundColor: [10, 10, 10],
    backgroundAlpha: 20,
    starColor: [120, 255, 158],
    orbColor: [40, 160, 80],
    nebulaColor: [18, 78, 36],
    quadtreeColor: [0, 255, 70, 40], // Faint green for the quadtree lines
    birdAlphaScale: 0.7,
    birdStride: 1,
    birdSizeScale: 0.88,
    trailAlphaScale: 0.72,
    haloAlphaScale: 0.62,
    coreAlphaScale: 0.9,
    connectionAlphaScale: 0.42,
    starIntensity: 0.98,
    orbIntensity: 0.82,
    localConnectionRadius: 78
  },
  hello_kitty: {
    boidColor: [219, 112, 147],
    lineColor: [255, 182, 193],
    backgroundColor: [255, 240, 245],
    backgroundAlpha: 12,
    starColor: [189, 64, 127],
    orbColor: [214, 96, 156],
    nebulaColor: [160, 76, 129],
    birdAlphaScale: 0.72,
    birdStride: 1,
    birdSizeScale: 0.88,
    trailAlphaScale: 0.7,
    haloAlphaScale: 0.8,
    coreAlphaScale: 0.9,
    connectionAlphaScale: 0.44,
    starIntensity: 1.16,
    orbIntensity: 1.08,
    localConnectionRadius: 76
  }
};

let flock = [];
let stars = [];
let celestialOrbs = [];
let currentTheme = themes.dark;
let forceClear = false;
let themeChangeTimeout = null;

// --- HELPER CLASSES (Quadtree, Point, Rectangle) ---
class Point {
  constructor(x, y, userData) { this.x = x; this.y = y; this.userData = userData; }
}

class Rectangle {
  constructor(x, y, w, h) { this.x = x; this.y = y; this.w = w; this.h = h; }
  contains(point) { return (point.x >= this.x - this.w && point.x <= this.x + this.w && point.y >= this.y - this.h && point.y <= this.y + this.h); }
  intersects(range) { return !(range.x - range.w > this.x + this.w || range.x + range.w < this.x - this.w || range.y - range.h > this.y + this.h || range.y + range.h < this.y - this.h); }
}

class Quadtree {
  constructor(boundary, capacity) {
    this.boundary = boundary; this.capacity = capacity; this.points = []; this.divided = false;
  }
  subdivide() {
    const { x, y, w, h } = this.boundary;
    this.northeast = new Quadtree(new Rectangle(x + w / 2, y - h / 2, w / 2, h / 2), this.capacity);
    this.northwest = new Quadtree(new Rectangle(x - w / 2, y - h / 2, w / 2, h / 2), this.capacity);
    this.southeast = new Quadtree(new Rectangle(x + w / 2, y + h / 2, w / 2, h / 2), this.capacity);
    this.southwest = new Quadtree(new Rectangle(x - w / 2, y + h / 2, w / 2, h / 2), this.capacity);
    this.divided = true;
  }
  insert(point) {
    if (!this.boundary.contains(point)) return false;
    if (this.points.length < this.capacity) { this.points.push(point); return true; }
    if (!this.divided) this.subdivide();
    return (this.northeast.insert(point) || this.northwest.insert(point) || this.southeast.insert(point) || this.southwest.insert(point));
  }
  query(range, found = []) {
    if (!this.boundary.intersects(range)) return found;
    for (let p of this.points) { if (range.contains(p)) found.push(p); }
    if (this.divided) { this.northwest.query(range, found); this.northeast.query(range, found); this.southwest.query(range, found); this.southeast.query(range, found); }
    return found;
  }
}

// --- CORE BOID CLASS ---
class Boid {
  constructor(x, y) {
    this.position = createVector(x, y);
    this.velocity = p5.Vector.random2D().mult(random(0.5, MAX_SPEED));
    this.acceleration = createVector();
    this.life = 0;
    this.phase = random(TWO_PI);
  }
  
  avoidEdges() {
    let steering = createVector();
    const margin = 50; const turnForce = 0.05;
    if (this.position.x < margin) steering.x += turnForce;
    if (this.position.x > width - margin) steering.x -= turnForce;
    if (this.position.y < margin) steering.y += turnForce;
    if (this.position.y > height - margin) steering.y -= turnForce;
    return steering.limit(MAX_FORCE);
  }

  align(boids) {
    let steering = createVector(); let total = 0; const perception = 50;
    for (let other of boids) { if (other !== this && this.position.dist(other.position) < perception) { steering.add(other.velocity); total++; } }
    if (total > 0) { steering.div(total).setMag(MAX_SPEED).sub(this.velocity).limit(MAX_FORCE); }
    return steering;
  }

  cohere(boids) {
    let steering = createVector(); let total = 0; const perception = 50;
    for (let other of boids) { if (other !== this && this.position.dist(other.position) < perception) { steering.add(other.position); total++; } }
    if (total > 0) { steering.div(total).sub(this.position).setMag(MAX_SPEED).sub(this.velocity).limit(MAX_FORCE); }
    return steering;
  }

  separate(boids) {
    let steering = createVector(); let total = 0; const minDistance = 24;
    for (let other of boids) {
      let d = this.position.dist(other.position);
      if (other !== this && d < minDistance) { let diff = p5.Vector.sub(this.position, other.position); diff.div(d * d); steering.add(diff); total++; }
    }
    if (total > 0) { steering.div(total).setMag(MAX_SPEED).sub(this.velocity).limit(MAX_FORCE); }
    return steering;
  }
  
  flock(boids) {
    this.acceleration.set(0);
    this.acceleration.add(this.align(boids).mult(1.0));
    this.acceleration.add(this.cohere(boids).mult(1.0));
    this.acceleration.add(this.separate(boids).mult(1.5));
    this.acceleration.add(this.avoidEdges());
  }

  update() {
    this.velocity.add(this.acceleration).limit(MAX_SPEED);
    this.position.add(this.velocity);
    if (this.life < FADE_IN_DURATION) this.life++;
  }

  display(alpha) {
    const sizeScale = currentTheme.birdSizeScale ?? 1;
    const pointSize = BOID_SIZE * 0.36 * sizeScale;
    const pulse = 0.88 + sin(frameCount * 0.05 + this.phase) * 0.12;
    const tailLength = BOID_SIZE * 1.05 * sizeScale;

    const tailDir = this.velocity.copy().normalize().mult(-tailLength);
    const tx = this.position.x + tailDir.x;
    const ty = this.position.y + tailDir.y;

    const trailAlphaScale = currentTheme.trailAlphaScale ?? 1;
    const haloAlphaScale = currentTheme.haloAlphaScale ?? 1;
    const coreAlphaScale = currentTheme.coreAlphaScale ?? 1;

    stroke(...currentTheme.boidColor, alpha * 0.32 * trailAlphaScale);
    strokeWeight(1.15);
    line(this.position.x, this.position.y, tx, ty);

    noStroke();
    fill(...currentTheme.boidColor, alpha * 0.16 * haloAlphaScale);
    circle(this.position.x, this.position.y, pointSize * 3.8);

    fill(...currentTheme.boidColor, alpha * pulse * coreAlphaScale);
    circle(this.position.x, this.position.y, pointSize);
  }
}

// --- P5.JS MAIN FUNCTIONS ---
function showQuadtree(qt) {
  noFill();
  strokeWeight(1);
  stroke(...currentTheme.quadtreeColor);
  
  let { x, y, w, h } = qt.boundary;
  rectMode(CENTER);
  rect(x, y, w * 2, h * 2);

  if (qt.divided) {
    showQuadtree(qt.northeast);
    showQuadtree(qt.northwest);
    showQuadtree(qt.southeast);
    showQuadtree(qt.southwest);
  }
}

function initCelestialField() {
  stars = [];
  celestialOrbs = [];

  for (let i = 0; i < NUM_STARS; i++) {
    stars.push({
      x: random(width),
      y: random(height),
      size: random(0.7, 2.3),
      baseAlpha: random(50, 175),
      twinkleSpeed: random(0.01, 0.045),
      twinklePhase: random(TWO_PI)
    });
  }

  for (let i = 0; i < NUM_ORBS; i++) {
    celestialOrbs.push({
      x: random(width),
      y: random(height),
      radius: random(min(width, height) * 0.08, min(width, height) * 0.2),
      alpha: random(12, 28),
      driftX: random(10, 24),
      driftY: random(8, 18),
      phase: random(TWO_PI)
    });
  }
}

function drawCelestialBackdrop() {
  const starColor = currentTheme.starColor || [230, 230, 255];
  const orbColor = currentTheme.orbColor || [160, 160, 220];
  const nebulaColor = currentTheme.nebulaColor || [120, 95, 170];

  // Soft nebula haze
  for (let i = 0; i < celestialOrbs.length; i++) {
    const orb = celestialOrbs[i];
    const t = frameCount * 0.0014 + orb.phase;
    const px = orb.x + sin(t) * orb.driftX;
    const py = orb.y + cos(t * 0.9) * orb.driftY;
    fill(...nebulaColor, orb.alpha * 0.62 * (currentTheme.orbIntensity ?? 1));
    circle(px, py, orb.radius * 2.8);
  }

  // Planet-like glows
  for (let i = 0; i < celestialOrbs.length; i++) {
    const orb = celestialOrbs[i];
    const t = frameCount * 0.0014 + orb.phase;
    const px = orb.x + sin(t) * orb.driftX;
    const py = orb.y + cos(t * 0.9) * orb.driftY;

    fill(...orbColor, orb.alpha * 0.44 * (currentTheme.orbIntensity ?? 1));
    circle(px, py, orb.radius * 1.7);
    fill(...orbColor, orb.alpha * 0.78 * (currentTheme.orbIntensity ?? 1));
    circle(px, py, orb.radius);
  }

  // Twinkling stars
  for (let i = 0; i < stars.length; i++) {
    const star = stars[i];
    const twinkle = (sin(frameCount * star.twinkleSpeed + star.twinklePhase) + 1) * 0.5;
    const alpha = star.baseAlpha * (0.45 + twinkle * 0.55) * (currentTheme.starIntensity ?? 1);

    fill(...starColor, alpha);
    circle(star.x, star.y, star.size);

    if (twinkle > 0.92 && star.size > 1.2) {
      stroke(...starColor, alpha * 0.6);
      strokeWeight(0.8);
      line(star.x - star.size * 1.8, star.y, star.x + star.size * 1.8, star.y);
      line(star.x, star.y - star.size * 1.8, star.x, star.y + star.size * 1.8);
      noStroke();
    }
  }
}

function setup() {
  let canvas = createCanvas(windowWidth, windowHeight);
  canvas.parent("particles");
  initCelestialField();
  for (let i = 0; i < NUM_BOIDS; i++) { flock.push(new Boid(random(width), random(height))); }
  const savedTheme = localStorage.getItem("theme") || "dark";
  updateTheme(savedTheme);
}

function updateTheme(themeName) {
  if (themes[themeName] && themes[themeName] !== currentTheme) {
    currentTheme = themes[themeName];
    forceClear = true;
  }
}

window.addEventListener("themeChanged", (e) => {
  if (themeChangeTimeout) clearTimeout(themeChangeTimeout);
  themeChangeTimeout = setTimeout(() => { updateTheme(e.detail.theme); }, 100);
});

function draw() {
  if (forceClear || !USE_MOTION_TRAILS) {
    background(...currentTheme.backgroundColor);
    forceClear = false;
  } else {
    background(...currentTheme.backgroundColor, currentTheme.backgroundAlpha);
  }

  drawCelestialBackdrop();

  let globalAlpha = map(flock[0]?.life || 0, 0, FADE_IN_DURATION, 0, 255, true) * (currentTheme.birdAlphaScale ?? 1);
  const localRadius = currentTheme.localConnectionRadius ?? CONNECTION_RADIUS;
  const birdStride = currentTheme.birdStride ?? 1;

  let qt = new Quadtree(new Rectangle(width / 2, height / 2, width / 2, height / 2), QUADTREE_CAPACITY);
  for (let boid of flock) { qt.insert(new Point(boid.position.x, boid.position.y, boid)); }
  
  if (currentTheme === themes.matrix) {
    showQuadtree(qt);
  }

  for (let i = 0; i < flock.length; i++) {
    let boid = flock[i];
    let range = new Rectangle(boid.position.x, boid.position.y, localRadius, localRadius);
    let nearby = qt.query(range).map(p => p.userData);
    
    if (currentTheme !== themes.matrix) {
      for(let other of nearby) {
          let d = boid.position.dist(other.position);
          if (d > 0 && d < localRadius) {
              let lineAlpha = map(d, 0, localRadius, 50, 0) * (currentTheme.connectionAlphaScale ?? 1);
              stroke(...currentTheme.lineColor, lineAlpha * (globalAlpha / 255));
              strokeWeight(1);
              line(boid.position.x, boid.position.y, other.position.x, other.position.y);
          }
      }
    }
    
    boid.flock(nearby);
    boid.update();
    if (i % birdStride === 0) boid.display(globalAlpha);
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  initCelestialField();
  forceClear = true;
}
