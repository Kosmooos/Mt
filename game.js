// --- GET CANVAS & CONTEXT ---
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

// --- RESIZE CANVAS ---
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

// --- LOAD IMAGES ---
let bgImg = new Image();
bgImg.src = "background.png";

let runnerImg = new Image();
runnerImg.src = "runner.png";

let collectibleImg1 = new Image();
collectibleImg1.src = "collectible1.png";

let collectibleImg2 = new Image();
collectibleImg2.src = "collectible2.png";

let collectibleImg3 = new Image();
collectibleImg3.src = "collectible3.png";

// --- ONLY START GAME AFTER IMAGES LOADED ---
let imagesLoaded = 0;
function checkLoaded() {
  imagesLoaded++;
  if (imagesLoaded === 5) loop();
}
[bgImg, runnerImg, collectibleImg1, collectibleImg2, collectibleImg3].forEach(img => {
  img.onload = checkLoaded;
});

// --- GAME VARIABLES ---
let player = {
  x: 150,
  y: canvas.height / 2,
  width: 110,
  height: 100,
  velocity: 0,
  gravity: 0.5,
  jumpPower: -10
};

let pipes = [];
let pipeWidth = 80;
let gap = 250;
let spawnInterval = 150;
let frame = 0;

let bgX = 0;
let bgSpeed = 2;

let nupoints = 0;
let gameOver = false;
let gameStarted = false;

// --- COLLISION HITBOX ---
const collisionMargin = 10;

// --- COLLECTIBLES ---
const collectibleTypes = [
  { img: collectibleImg1, points: 1, extraTasty: true },
  { img: collectibleImg2, points: 1, extraTasty: false },
  { img: collectibleImg3, points: 2, extraTasty: false }
];
let collectibles = [];
let collectibleSpawnInterval = 300;
let particles = [];

function createParticles(x, y, color = "white", count = 10) {
  for (let i = 0; i < count; i++) {
    particles.push({
      x: x + 40,  // center of collectible
      y: y + 40,
      vx: (Math.random() - 0.5) * 4, // horizontal velocity
      vy: (Math.random() - 1.5) * 4, // vertical velocity
      alpha: 1,
      size: Math.random() * 4 + 2,
      color: color
    });
  }
}


// --- UPDATE ---
function update() {
  frame++;

  // Scroll background
  bgX -= bgSpeed;
  if (bgX <= -canvas.width) bgX = 0;

  // Gravity
  player.velocity += player.gravity;
  player.y += player.velocity;

  // Spawn pipes
  if (frame % spawnInterval === 0) {
    let topHeight = Math.random() * (canvas.height - gap - 100) + 50;
    pipes.push({
      x: canvas.width,
      top: topHeight,
      bottom: topHeight + gap,
      passed: false
    });
  }

  // Move pipes
  pipes.forEach(pipe => pipe.x -= 5);

  // Collision with pipes & scoring
  pipes.forEach(pipe => {
    if (!gameOver &&
        player.x + player.width / 2 - collisionMargin > pipe.x &&
        player.x - player.width / 2 + collisionMargin < pipe.x + pipeWidth &&
        (player.y - player.height / 2 + collisionMargin < pipe.top ||
         player.y + player.height / 2 - collisionMargin > pipe.bottom)) {
      gameOver = true;
      restartGame("pipe");
    }

    if (!pipe.passed && pipe.x + pipeWidth < player.x) {
      pipe.passed = true;
      nupoints++;
    }
  });

  // Player falls off screen
  if (!gameOver && (player.y > canvas.height || player.y < 0)) {
    gameOver = true;
    restartGame("fall");
  }

  // Spawn collectibles
  if (frame % collectibleSpawnInterval === 0 && pipes.length > 0) {
    let pipe = pipes[pipes.length - 1];
    let margin = 20;
    let maxY = pipe.bottom - margin - 60;
    let minY = pipe.top + margin;
    let yPos = Math.random() * (maxY - minY) + minY;
    let type = collectibleTypes[Math.floor(Math.random() * collectibleTypes.length)];

    collectibles.push({
      x: canvas.width,
      y: yPos,
      width: 80,
      height: 80,
      collected: false,
      animationFrame: 0,
      type: type
    });
  }

  // Move collectibles & check collision
  collectibles.forEach(item => {
    item.x -= 5;

    if (!item.collected &&
        player.x + player.width / 2 - collisionMargin > item.x &&
        player.x - player.width / 2 + collisionMargin < item.x + item.width &&
        player.y + player.height / 2 - collisionMargin > item.y &&
        player.y - player.height / 2 + collisionMargin < item.y + item.height) {

      item.collected = true;
      item.animationFrame = 0;

      // Create particles for this collectible
      createParticles(item.x, item.y, item.type.extraTasty ? "gold" : "white", 15);
    }
  });

  // Remove offscreen or finished collectibles
  collectibles = collectibles.filter(item => item.x + item.width > 0 || item.animationFrame <= 30);
}


// --- DRAW ---
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Background
  ctx.drawImage(bgImg, bgX, 0, canvas.width, canvas.height);
  ctx.drawImage(bgImg, bgX + canvas.width, 0, canvas.width, canvas.height);

  // Pipes
  pipes.forEach(pipe => {
    ctx.fillStyle = "white";
    ctx.fillRect(pipe.x - 2, 0, pipeWidth + 4, pipe.top);
    ctx.fillStyle = "#e4005e";
    ctx.fillRect(pipe.x, 0, pipeWidth, pipe.top);

    ctx.fillStyle = "white";
    ctx.fillRect(pipe.x - 2, pipe.bottom, pipeWidth + 4, canvas.height - pipe.bottom);
    ctx.fillStyle = "#e4005e";
    ctx.fillRect(pipe.x, pipe.bottom, pipeWidth, canvas.height - pipe.bottom);
  });

  // Collectibles
  collectibles.forEach(item => {
    if (!item.collected) {
      ctx.drawImage(item.type.img, item.x, item.y, item.width, item.height);
    } else {
      const alpha = 1 - item.animationFrame / 30;
      ctx.fillStyle = `rgba(255,255,255,${alpha})`;
      ctx.font = "30px Maratype";
      ctx.fillText("Sustenance!", item.x, item.y - item.animationFrame * 2);

      if (item.type.extraTasty) {
        ctx.fillText("Extra", item.x, item.y - item.animationFrame * 2 - 30);
      }

      item.animationFrame++;
      if (item.animationFrame === 15) nupoints += item.type.points;
    }
  });

// Draw and update particles in your draw() function
for (let i = particles.length - 1; i >= 0; i--) {
  let p = particles[i];

  ctx.fillStyle = `rgba(${p.color === "gold" ? "255,215,0" : "255,255,255"},${p.alpha})`;
  ctx.fillRect(
    p.x - p.size / 2,
    p.y - p.size / 2,
    p.size,
    p.size
  );

  p.x += p.vx;
  p.y += p.vy;
  p.alpha -= 0.02;
  p.size *= 0.95;

  if (p.alpha <= 0 || p.size <= 0.5) {
    particles.splice(i, 1);
  }
}



  // Player
  ctx.drawImage(runnerImg, player.x - player.width / 2, player.y - player.height / 2, player.width, player.height);

  // NuPoints
  ctx.fillStyle = "white";
  ctx.font = "28px Arial";
  ctx.fillText("NuPoints: " + nupoints, 20, 110);

  // Click to start
  if (!gameStarted) {
    ctx.fillStyle = "white";
    ctx.font = "40px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Click or press any key to start!", canvas.width / 2, canvas.height / 2);
    ctx.textAlign = "start";
  }
}

// --- LOOP ---
function loop() {
  if (gameStarted && !gameOver) update();
  draw();
  requestAnimationFrame(loop);
}

// --- RESTART ---
function restartGame(hitType) {
  if(hitType === "pipe") alert("Bonk");
  if(hitType === "fall") alert("Great. You killed the cat. Printing new shell...");

  setTimeout(() => {
    player.y = canvas.height / 2;
    player.velocity = 0;
    pipes = [];
    collectibles = [];
    frame = 0;
    gameOver = false;
    gameStarted = false;
    nupoints = 0;
  }, 100);
}

// --- CONTROLS ---
function startGame() { if(!gameStarted) gameStarted = true; }

document.addEventListener("keydown", startGame);
canvas.addEventListener("click", startGame);

// Jump controls
document.addEventListener("keydown", () => { if(gameStarted) player.velocity = player.jumpPower; });
canvas.addEventListener("click", () => { if(gameStarted) player.velocity = player.jumpPower; });
