/* =========================================
   VERONAZ.EXE — interactions & easter eggs
   ========================================= */

document.addEventListener("DOMContentLoaded", () => {
  initCommit();
  initSecret();
  initRandomThoughts();
  initLeafGame();
});

/* -----------------------------------------
   1. COMMIT THE CAT
   ----------------------------------------- */

function initCommit() {
  const cat = document.getElementById("cat");
  const message = document.getElementById("cat-message");

  if (!cat || !message) return;

  const messages = [
    "purr.exe has started successfully.",
    "Commit says: you're doing great. Probably.",
    "Meow. Have you committed your code today?",
    "01001101 01100101 01101111 01110111",
    "Commit approves this questionable life choice.",
    "No bugs detected. Only vibes.",
    "You have been selected for a mandatory cat break.",
    "git commit -m 'made it through today'",
    "System status: emotionally supported.",
    "Commit is judging your tab count.",
    "A little progress is still progress.",
    "This cat has zero certifications and infinite confidence."
  ];

  let lastMessage = -1;

  function petCat() {
    let next;

    do {
      next = Math.floor(Math.random() * messages.length);
    } while (next === lastMessage && messages.length > 1);

    lastMessage = next;
    message.textContent = messages[next];

    cat.classList.remove("cat-petted");

    // Restart the little reaction animation.
    void cat.offsetWidth;
    cat.classList.add("cat-petted");
  }

  cat.addEventListener("click", petCat);

  cat.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      petCat();
    }
  });
}

/* -----------------------------------------
   2. SECRET MESSAGE
   ----------------------------------------- */

function initSecret() {
  const button = document.getElementById("secret-button");
  const message = document.getElementById("secret-message");

  if (!button || !message) return;

  const secretMessages = [
    "Plot twist: you're allowed to be a work in progress.",
    "Achievement unlocked: you found the tiny corner of the internet.",
    "Reminder from future you: keep making weird little things.",
    "Not everything needs to become a side project. Sometimes rest is the project.",
    "You made it here. That's a tiny win. Take it.",
    "404: a perfect life not found. Good thing we're building a real one.",
    "A little curiosity can take you to some pretty unexpected places."
  ];

  let revealed = false;

  button.addEventListener("click", () => {
    if (revealed) {
      message.hidden = true;
      button.setAttribute("aria-expanded", "false");
      button.setAttribute("aria-label", "Reveal a secret message");
      revealed = false;
      return;
    }

    const randomIndex = Math.floor(
      Math.random() * secretMessages.length
    );

    message.textContent = secretMessages[randomIndex];
    message.hidden = false;

    button.setAttribute("aria-expanded", "true");
    button.setAttribute("aria-label", "Hide secret message");
    revealed = true;
  });
}

/* -----------------------------------------
   3. RANDOM THOUGHTS
   ----------------------------------------- */

function initRandomThoughts() {
  const button = document.getElementById("random-note");
  const text = document.getElementById("random-note-text");

  if (!button || !text) return;

  const thoughts = [
    "Somewhere between 'I have an idea' and 'why is it not compiling?'",
    "What if the plot twist is that it actually works?",
    "Currently collecting skills, screenshots, and oddly specific interests.",
    "Building things is just asking questions with extra steps.",
    "One day this will be a very funny story. Probably.",
    "Reminder: you don't have to have the whole map to take the next step.",
    "A brain with 27 tabs open and absolutely no intention of closing them.",
    "The side quest is becoming the main quest again.",
    "Curiosity is a pretty good reason to start.",
    "Today's forecast: 40% code, 30% overthinking, 30% snacks.",
    "Some ideas deserve a prototype before they deserve an explanation.",
    "Under construction, but the construction is kind of the point.",
    "Professional overthinker. Amateur sleep enthusiast.",
    "The best debugging tool is sometimes a walk and a snack.",
    "I came. I saw. I opened another tab."
  ];

  let previousIndex = -1;

  button.addEventListener("click", () => {
    let nextIndex;

    do {
      nextIndex = Math.floor(Math.random() * thoughts.length);
    } while (nextIndex === previousIndex && thoughts.length > 1);

    previousIndex = nextIndex;

    text.classList.remove("thought-change");
    void text.offsetWidth;

    text.textContent = thoughts[nextIndex];
    text.classList.add("thought-change");
  });
}

/* -----------------------------------------
   4. CATCH THE FALLING LEAVES
   ----------------------------------------- */

function initLeafGame() {
  const board = document.getElementById("game-board");
  const welcome = document.getElementById("game-welcome");
  const startButton = document.getElementById("start-game");
  const leafLayer = document.getElementById("leaf-layer");
  const scoreDisplay = document.getElementById("score");
  const timeDisplay = document.getElementById("time");
  const bestDisplay = document.getElementById("best");
  const status = document.getElementById("game-status");

  if (
    !board ||
    !welcome ||
    !startButton ||
    !leafLayer ||
    !scoreDisplay ||
    !timeDisplay ||
    !bestDisplay ||
    !status
  ) {
    return;
  }

  const GAME_DURATION = 20;
  const BEST_KEY = "vero-cozy-best";

  const leaves = ["🍂", "🍁", "🍃", "🌿"];
  const bestSaved = Number(localStorage.getItem(BEST_KEY)) || 0;

  let score = 0;
  let timeLeft = GAME_DURATION;
  let best = bestSaved;
  let gameActive = false;
  let countdownInterval = null;
  let spawnInterval = null;
  let endTimeout = null;

  bestDisplay.textContent = String(best);
  timeDisplay.textContent = String(timeLeft);
  scoreDisplay.textContent = String(score);

  function updateStatus(text) {
    status.textContent = text;
  }

  function clearGameTimers() {
    if (countdownInterval !== null) {
      clearInterval(countdownInterval);
      countdownInterval = null;
    }

    if (spawnInterval !== null) {
      clearInterval(spawnInterval);
      spawnInterval = null;
    }

    if (endTimeout !== null) {
      clearTimeout(endTimeout);
      endTimeout = null;
    }
  }

  function removeLeaves() {
    leafLayer.replaceChildren();
  }

  function updateScore() {
    scoreDisplay.textContent = String(score);

    if (score > best) {
      best = score;
      bestDisplay.textContent = String(best);

      try {
        localStorage.setItem(BEST_KEY, String(best));
      } catch {
        // The game still works if browser storage is unavailable.
      }
    }
  }

  function createLeaf() {
    if (!gameActive) return;

    const leaf = document.createElement("button");
    const emoji = leaves[Math.floor(Math.random() * leaves.length)];

    leaf.type = "button";
    leaf.className = "leaf";
    leaf.textContent = emoji;
    leaf.setAttribute("aria-label", "Catch a falling leaf");

    const maxX = Math.max(0, board.clientWidth - 45);
    const maxY = Math.max(0, board.clientHeight - 45);

    const x = Math.random() * maxX;
    const y = Math.random() * maxY;
    const rotation = Math.random() * 60 - 30;

    leaf.style.left = `${x}px`;
    leaf.style.top = `${y}px`;
    leaf.style.transform = `rotate(${rotation}deg)`;

    leaf.addEventListener("click", () => {
      if (!gameActive || !leaf.isConnected) return;

      score += 1;
      updateScore();

      leaf.remove();

      if (score === 1) {
        updateStatus("First leaf caught. We're so back.");
      } else if (score % 5 === 0) {
        updateStatus(`${score} leaves caught. Look at you go!`);
      } else {
        updateStatus("Nice catch ✨");
      }
    });

    leafLayer.appendChild(leaf);

    // Keep the board from filling up indefinitely.
    window.setTimeout(() => {
      if (leaf.isConnected) leaf.remove();
    }, 2200);
  }

  function finishGame() {
    if (!gameActive) return;

    gameActive = false;
    clearGameTimers();
    removeLeaves();

    welcome.hidden = false;
    welcome.innerHTML = `
      <h4>Time's up! 🍂</h4>
      <p>You caught ${score} ${score === 1 ? "leaf" : "leaves"}.
      ${score >= best && score > 0 ? "New personal best energy." : "Ready for another round?"}</p>
      <button class="button" id="play-again" type="button">
        Play again ↻
      </button>
    `;

    const playAgain = document.getElementById("play-again");

    if (playAgain) {
      playAgain.addEventListener("click", startGame);
    }

    startButton.textContent = "Play again ↻";

    if (score === 0) {
      updateStatus("No leaves caught this time. The leaves are winning.");
    } else {
      updateStatus(`Round complete — ${score} ${score === 1 ? "leaf" : "leaves"} caught.`);
    }
  }

  function startGame() {
    clearGameTimers();
    removeLeaves();

    score = 0;
    timeLeft = GAME_DURATION;
    gameActive = true;

    scoreDisplay.textContent = "0";
    timeDisplay.textContent = String(timeLeft);
    startButton.textContent = "Restart round ↻";

    welcome.hidden = true;
    welcome.replaceChildren();

    updateStatus("Go go go! Catch as many as you can.");

    // Spawn leaves at a steady pace.
    createLeaf();

    spawnInterval = window.setInterval(() => {
      createLeaf();
    }, 600);

    countdownInterval = window.setInterval(() => {
      timeLeft -= 1;
      timeDisplay.textContent = String(Math.max(0, timeLeft));

      if (timeLeft <= 0) {
        finishGame();
      }
    }, 1000);
  }

  startButton.addEventListener("click", startGame);

  // Support the initial welcome screen and the play-again button.
  welcome.hidden = false;
}

