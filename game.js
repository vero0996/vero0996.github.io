
const cat = document.querySelector("#cat");
const catMessage = document.querySelector("#cat-message");

const catMessages = [
  "purr... commit approved! 🐾",
  "no bugs, only purrs.",
  "404: nap not found.",
  "you're doing paw-some! ☕",
  "one more commit, human."
];

let catMessageIndex = 0;

function petCat() {
  cat.classList.remove("happy");
  void cat.offsetWidth;
  cat.classList.add("happy");

  catMessageIndex = (catMessageIndex + 1) % catMessages.length;
  catMessage.textContent = catMessages[catMessageIndex];
}

cat.addEventListener("click", petCat);

cat.addEventListener("keydown", (event) => {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    petCat();
  }
});

// Secret button
const secretButton = document.querySelector("#secret-button");
const secretMessage = document.querySelector("#secret-message");

secretButton.addEventListener("click", () => {
  secretMessage.hidden = false;
  secretButton.textContent = "surprise unlocked ♡";
  secretButton.disabled = true;
});

// Catch the Falling Leaves
const board = document.querySelector("#game-board");
const leafLayer = document.querySelector("#leaf-layer");
const startButton = document.querySelector("#start-game");
const welcome = document.querySelector("#game-welcome");
const scoreElement = document.querySelector("#score");
const timeElement = document.querySelector("#time");
const bestElement = document.querySelector("#best");
const statusElement = document.querySelector("#game-status");

const LEAVES = ["🍂", "🍁", "🌰", "🍃"];
const GAME_DURATION = 20;
const BEST_SCORE_KEY = "vero-cozy-best";

let score = 0;
let timeLeft = GAME_DURATION;
let playing = false;
let gameTimer = null;
let spawnTimer = null;
let best = 0;

try {
  best = Number(localStorage.getItem(BEST_SCORE_KEY)) || 0;
} catch {
  best = 0;
}

bestElement.textContent = best;

function updateScore() {
  scoreElement.textContent = score;
  timeElement.textContent = timeLeft;
  bestElement.textContent = best;
}

function clearGame() {
  clearInterval(gameTimer);
  clearInterval(spawnTimer);
  gameTimer = null;
  spawnTimer = null;
  leafLayer.replaceChildren();
}

function spawnLeaf() {
  if (!playing) return;

  const leaf = document.createElement("button");
  leaf.type = "button";
  leaf.className = "leaf";
  leaf.textContent = LEAVES[Math.floor(Math.random() * LEAVES.length)];
  leaf.setAttribute("aria-label", "Catch leaf");

  const maxLeft = Math.max(0, board.clientWidth - 45);
  leaf.style.left = `${Math.random() * maxLeft}px`;

  const duration = 2.4 + Math.random() * 1.5;
  leaf.style.animationDuration = `${duration}s`;

  let caught = false;

  leaf.addEventListener("click", () => {
    if (!playing || caught) return;

    caught = true;
    score += 1;
    updateScore();
    leaf.remove();

    if (score > best) {
      best = score;
      bestElement.textContent = best;

      try {
        localStorage.setItem(BEST_SCORE_KEY, String(best));
      } catch {
        // The game still works if storage is unavailable.
      }
    }
  });

  leaf.addEventListener("animationend", () => leaf.remove());

  leafLayer.appendChild(leaf);
}

function endGame() {
  playing = false;
  clearGame();
  welcome.hidden = false;
  startButton.textContent = "play again";

  statusElement.textContent =
    `Time's up! You collected ${score} ${score === 1 ? "leaf" : "leaves"}. 🍂`;

  welcome.querySelector("p").textContent =
    `You caught ${score} leaves. Ready for another round?`;
}

function startGame() {
  clearGame();

  score = 0;
  timeLeft = GAME_DURATION;
  playing = true;

  updateScore();
  welcome.hidden = true;
  statusElement.textContent = "Quick! Catch the falling leaves! 🍁";

  spawnLeaf();
  spawnTimer = setInterval(spawnLeaf, 650);

  gameTimer = setInterval(() => {
    timeLeft -= 1;
    updateScore();

    if (timeLeft <= 0) {
      endGame();
    }
  }, 1000);
}

startButton.addEventListener("click", startGame);