
document.addEventListener("DOMContentLoaded", () => {
  const stage = document.getElementById("arcade-stage");
  const leafPanel = document.getElementById("leaf-game-panel");
  const choices = [...document.querySelectorAll("[data-arcade-game]")];

  if (!stage || !leafPanel || !choices.length) return;

  let cleanupCurrentGame = () => {};

  function selectGame(name) {
    cleanupCurrentGame();
    cleanupCurrentGame = () => {};

    choices.forEach((button) => {
      const active = button.dataset.arcadeGame === name;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });

    const isLeaves = name === "leaves";
    leafPanel.hidden = !isLeaves;
    stage.hidden = isLeaves;
    stage.replaceChildren();

    if (isLeaves) return;

    const cleanups = [];
    const addCleanup = (fn) => cleanups.push(fn);

    if (name === "2048") render2048(stage, addCleanup);
    if (name === "tetris") renderTetris(stage, addCleanup);
    if (name === "mahjong") renderMahjong(stage);
    if (name === "solitaire") renderSolitaire(stage);

    cleanupCurrentGame = () => cleanups.forEach((fn) => fn());
  }

  choices.forEach((button) => {
    button.addEventListener("click", () => {
      selectGame(button.dataset.arcadeGame);
    });
  });

  // Start with the existing falling-leaves game.
  selectGame("leaves");
});

function arcadeHeader(title, subtitle) {
  const header = document.createElement("div");
  header.className = "arcade-topline";
  header.innerHTML = `
    <div>
      <h3>${title}</h3>
      <span class="arcade-muted">${subtitle}</span>
    </div>
  `;
  return header;
}

function arcadeButton(label, action) {
  const button = document.createElement("button");
  button.className = "arcade-btn";
  button.type = "button";
  button.textContent = label;
  button.addEventListener("click", action);
  return button;
}

function arcadeHelp(text) {
  const help = document.createElement("p");
  help.className = "arcade-help";
  help.textContent = text;
  return help;
}

/* =========================
   2048
========================= */

function render2048(root, addCleanup) {
  let board;
  let score;
  let over = false;
  let points = 0;

  const bestKey = "vero-2048-best";
  let best = Number(localStorage.getItem(bestKey) || 0);

  const header = arcadeHeader("2048", "Merge the tiles. Reach 2048.");
  const scoreText = document.createElement("span");
  scoreText.className = "arcade-muted";
  header.append(scoreText);

  const grid = document.createElement("div");
  grid.className = "arcade-grid-2048";
  grid.setAttribute("aria-label", "2048 game board");

  const controls = document.createElement("div");
  controls.className = "tetris-controls";

  const message = document.createElement("p");
  message.className = "arcade-help";
  message.setAttribute("aria-live", "polite");

  root.append(header, grid, controls, message);

  function reset() {
    board = Array.from({ length: 4 }, () => Array(4).fill(0));
    points = 0;
    over = false;
    addTile();
    addTile();
    draw();
    message.textContent = "Use the arrow keys or buttons to move tiles.";
  }

  function addTile() {
    const empty = [];
    board.forEach((row, r) => row.forEach((value, c) => {
      if (!value) empty.push([r, c]);
    }));

    if (!empty.length) return;
    const [r, c] = empty[Math.floor(Math.random() * empty.length)];
    board[r][c] = Math.random() < 0.9 ? 2 : 4;
  }

  function draw() {
    grid.replaceChildren();

    board.flat().forEach((value) => {
      const cell = document.createElement("div");
      cell.className = "tile-2048";
      cell.dataset.value = value || "";
      cell.textContent = value ? String(value) : "";
      grid.append(cell);
    });

    best = Math.max(best, points);
    localStorage.setItem(bestKey, String(best));
    scoreText.textContent = `SCORE ${points} · BEST ${best}`;
  }

  function slide(line) {
    const values = line.filter(Boolean);
    const result = [];

    for (let i = 0; i < values.length; i++) {
      if (values[i] === values[i + 1]) {
        const merged = values[i] * 2;
        result.push(merged);
        points += merged;
        i++;
      } else {
        result.push(values[i]);
      }
    }

    while (result.length < 4) result.push(0);
    return result;
  }

  function move(direction) {
    if (over) return;

    const before = JSON.stringify(board);

    if (direction === "left" || direction === "right") {
      board = board.map((row) => {
        const line = direction === "right" ? [...row].reverse() : [...row];
        const next = slide(line);
        return direction === "right" ? next.reverse() : next;
      });
    } else {
      for (let c = 0; c < 4; c++) {
        let line = board.map((row) => row[c]);
        if (direction === "down") line.reverse();

        line = slide(line);
        if (direction === "down") line.reverse();

        for (let r = 0; r < 4; r++) board[r][c] = line[r];
      }
    }

    if (before === JSON.stringify(board)) return;

    addTile();
    draw();

    if (board.flat().includes(2048)) {
      message.textContent = "You made 2048! Keep going or start a new game.";
    } else if (!canMove()) {
      over = true;
      message.textContent = "No moves left. Try another round!";
    }
  }

  function canMove() {
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (!board[r][c]) return true;
        if (c < 3 && board[r][c] === board[r][c + 1]) return true;
        if (r < 3 && board[r][c] === board[r + 1][c]) return true;
      }
    }
    return false;
  }

  const keyHandler = (event) => {
    const keys = {
      ArrowLeft: "left",
      ArrowRight: "right",
      ArrowUp: "up",
      ArrowDown: "down"
    };

    if (!keys[event.key] || !root.contains(grid)) return;
    event.preventDefault();
    move(keys[event.key]);
  };

  document.addEventListener("keydown", keyHandler);
  addCleanup(() => document.removeEventListener("keydown", keyHandler));

  [["←", "left"], ["↑", "up"], ["↓", "down"], ["→", "right"]]
    .forEach(([label, direction]) => {
      controls.append(arcadeButton(label, () => move(direction)));
    });

  controls.append(arcadeButton("New game", reset));

  let touchStart = null;

  grid.addEventListener("touchstart", (event) => {
    const touch = event.changedTouches[0];
    touchStart = [touch.clientX, touch.clientY];
  }, { passive: true });

  grid.addEventListener("touchend", (event) => {
    if (!touchStart) return;
    const touch = event.changedTouches[0];
    const dx = touch.clientX - touchStart[0];
    const dy = touch.clientY - touchStart[1];
    touchStart = null;

    if (Math.max(Math.abs(dx), Math.abs(dy)) < 20) return;

    move(Math.abs(dx) > Math.abs(dy)
      ? (dx > 0 ? "right" : "left")
      : (dy > 0 ? "down" : "up"));
  }, { passive: true });

  reset();
}

/* =========================
   TETRIS
========================= */

function renderTetris(root, addCleanup) {
  const W = 10;
  const H = 20;

  const SHAPES = [
    [[1, 1, 1, 1]],
    [[1, 1], [1, 1]],
    [[0, 1, 0], [1, 1, 1]],
    [[1, 0, 0], [1, 1, 1]],
    [[0, 0, 1], [1, 1, 1]],
    [[0, 1, 1], [1, 1, 0]],
    [[1, 1, 0], [0, 1, 1]]
  ];

  let board;
  let piece;
  let score = 0;
  let lines = 0;
  let over = false;
  let timer = null;

  root.append(arcadeHeader("Tetris", "Stack the blocks. Clear the lines."));

  const scoreLabel = document.createElement("p");
  scoreLabel.className = "arcade-muted";

  const layout = document.createElement("div");
  layout.className = "tetris-layout";

  const canvas = document.createElement("div");
  canvas.className = "tetris-board";
  canvas.setAttribute("aria-label", "Tetris board");

  const side = document.createElement("div");
  side.className = "arcade-muted";

  layout.append(canvas, side);

  const controls = document.createElement("div");
  controls.className = "tetris-controls";

  const message = document.createElement("p");
  message.className = "arcade-help";
  message.setAttribute("aria-live", "polite");

  root.append(scoreLabel, layout, controls, message);

  const cells = [];
  for (let i = 0; i < W * H; i++) {
    const cell = document.createElement("div");
    cell.className = "tetris-cell";
    canvas.append(cell);
    cells.push(cell);
  }

  function randomPiece() {
    const shape = SHAPES[Math.floor(Math.random() * SHAPES.length)]
      .map((row) => [...row]);

    return {
      shape,
      x: Math.floor((W - shape[0].length) / 2),
      y: 0
    };
  }

  function collides(p, dx = 0, dy = 0, shape = p.shape) {
    for (let y = 0; y < shape.length; y++) {
      for (let x = 0; x < shape[y].length; x++) {
        if (!shape[y][x]) continue;

        const nx = p.x + x + dx;
        const ny = p.y + y + dy;

        if (nx < 0 || nx >= W || ny >= H) return true;
        if (ny >= 0 && board[ny][nx]) return true;
      }
    }
    return false;
  }

  function lockPiece() {
    piece.shape.forEach((row, y) => row.forEach((value, x) => {
      if (value && piece.y + y >= 0) {
        board[piece.y + y][piece.x + x] = 1;
      }
    }));

    let cleared = 0;
    board = board.filter((row) => {
      if (row.every(Boolean)) {
        cleared++;
        return false;
      }
      return true;
    });

    while (board.length < H) board.unshift(Array(W).fill(0));

    if (cleared) {
      lines += cleared;
      score += [0, 100, 300, 500, 800][cleared] || cleared * 200;
    }

    piece = randomPiece();

    if (collides(piece)) {
      over = true;
      message.textContent = "Game over. Start a new round!";
      clearInterval(timer);
    }

    draw();
  }

  function draw() {
    cells.forEach((cell, i) => {
      const y = Math.floor(i / W);
      const x = i % W;
      const active = piece && piece.shape[y - piece.y]
        && piece.shape[y - piece.y][x - piece.x]
        && x >= piece.x && y >= piece.y;

      cell.classList.toggle("filled", Boolean(board[y][x] || active));
    });

    scoreLabel.textContent = `SCORE ${score} · LINES ${lines}`;
    side.textContent = `Lines cleared: ${lines}`;
  }

  function act(action) {
    if (over) return;

    if (action === "left" && !collides(piece, -1, 0)) piece.x--;
    if (action === "right" && !collides(piece, 1, 0)) piece.x++;
    if (action === "down") {
      if (!collides(piece, 0, 1)) {
        piece.y++;
        score++;
      } else {
        lockPiece();
        return;
      }
    }
    if (action === "rotate") {
      const rotated = piece.shape[0].map((_, i) =>
        piece.shape.map((row) => row[i]).reverse()
      );
      if (!collides(piece, 0, 0, rotated)) piece.shape = rotated;
    }
    if (action === "drop") {
      while (!collides(piece, 0, 1)) {
        piece.y++;
        score += 2;
      }
      lockPiece();
      return;
    }

    draw();
  }

  function reset() {
    clearInterval(timer);
    board = Array.from({ length: H }, () => Array(W).fill(0));
    piece = randomPiece();
    score = 0;
    lines = 0;
    over = false;
    message.textContent = "Arrow keys to move; ↑ to rotate; Space to drop.";
    draw();

    timer = setInterval(() => act("down"), 650);
  }

  const keyHandler = (event) => {
    if (!root.contains(canvas) || over) return;

    const map = {
      ArrowLeft: "left",
      ArrowRight: "right",
      ArrowDown: "down",
      ArrowUp: "rotate",
      " ": "drop"
    };

    if (!map[event.key]) return;
    event.preventDefault();
    act(map[event.key]);
  };

  document.addEventListener("keydown", keyHandler);

  addCleanup(() => {
    clearInterval(timer);
    document.removeEventListener("keydown", keyHandler);
  });

  [
    ["←", "left"], ["↓", "down"], ["→", "right"],
    ["Rotate", "rotate"], ["Drop", "drop"]
  ].forEach(([label, action]) => {
    controls.append(arcadeButton(label, () => act(action)));
  });

  controls.append(arcadeButton("New game", reset));

  reset();
}

/* =========================
   MAHJONG SOLITAIRE
   A compact matching-pairs version.
========================= */

function renderMahjong(root) {
  const symbols = ["竹", "發", "中", "東", "南", "西", "北", "春", "夏", "秋", "冬", "梅"];
  let tiles = [];
  let selected = null;
  let matched = 0;
  let locked = false;

  root.append(arcadeHeader("Mahjong Solitaire", "Match pairs of free tiles."));

  const status = document.createElement("p");
  status.className = "arcade-muted";

  const board = document.createElement("div");
  board.className = "mahjong-board";

  const controls = document.createElement("div");
  controls.className = "tetris-controls";

  const help = arcadeHelp(
    "A tile is free when at least one side is open. Match identical free tiles to clear the board."
  );

  root.append(status, board, controls, help);

  function isFree(index) {
    const col = index % 6;
    const leftFree = col === 0 || tiles[index - 1].gone;
    const rightFree = col === 5 || tiles[index + 1].gone;
    return !tiles[index].gone && (leftFree || rightFree);
  }

  function shuffle(items) {
    for (let i = items.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [items[i], items[j]] = [items[j], items[i]];
    }
    return items;
  }

  function draw() {
    board.replaceChildren();

    tiles.forEach((tile, index) => {
      if (tile.gone) {
        const spacer = document.createElement("div");
        board.append(spacer);
        return;
      }

      const button = document.createElement("button");
      button.type = "button";
      button.className = "mahjong-tile";
      button.textContent = tile.symbol;
      button.setAttribute("aria-label", `Tile ${tile.symbol}`);

      if (!isFree(index)) {
        button.classList.add("blocked");
        button.disabled = true;
      }

      if (selected === index) button.classList.add("selected");

      button.addEventListener("click", () => choose(index));
      board.append(button);
    });

    status.textContent = `PAIRS LEFT: ${(tiles.length - matched) / 2}`;
  }

  function choose(index) {
    if (locked || tiles[index].gone || !isFree(index)) return;

    if (selected === index) {
      selected = null;
      draw();
      return;
    }

    if (selected === null) {
      selected = index;
      draw();
      return;
    }

    if (tiles[selected].symbol === tiles[index].symbol) {
      tiles[selected].gone = true;
      tiles[index].gone = true;
      matched += 2;
      selected = null;
      draw();

      if (matched === tiles.length) {
        status.textContent = "Board cleared! Lovely work.";
      }
    } else {
      const previous = selected;
      selected = index;
      draw();
      locked = true;

      window.setTimeout(() => {
        selected = null;
        locked = false;
        draw();
      }, 450);
    }
  }

  function reset() {
    const pairs = symbols.flatMap((symbol) => [symbol, symbol]);
    shuffle(pairs);

    tiles = pairs.map((symbol) => ({ symbol, gone: false }));
    selected = null;
    matched = 0;
    locked = false;
    draw();
  }

  controls.append(arcadeButton("Shuffle / restart", reset));
  reset();
}

/* =========================
   KLONDIKE SOLITAIRE
========================= */

function renderSolitaire(root) {
  const suits = ["♠", "♥", "♣", "♦"];
  const ranks = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

  let stock = [];
  let waste = [];
  let foundations = [[], [], [], []];
  let columns = Array.from({ length: 7 }, () => []);
  let selected = null;
  let won = false;

  root.append(arcadeHeader("Klondike Solitaire", "Build four foundations from Ace to King."));

  const top = document.createElement("div");
  top.className = "solitaire-row";

  const tableau = document.createElement("div");
  tableau.className = "solitaire-board";

  const message = document.createElement("p");
  message.className = "arcade-help";
  message.setAttribute("aria-live", "polite");
  message.textContent = "Select a face-up card, then choose a destination pile.";

  const controls = document.createElement("div");
  controls.className = "tetris-controls";

  root.append(top, tableau, controls, message);

  function newDeck() {
    const deck = [];
    suits.forEach((suit, suitIndex) => {
      ranks.forEach((rank, value) => {
        deck.push({
          suit,
          suitIndex,
          rank,
          value: value + 1,
          red: suit === "♥" || suit === "♦",
          faceUp: false
        });
      });
    });

    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }

    return deck;
  }

  function label(card) {
    return `${card.rank}${card.suit}`;
  }

  function makeCard(card, onClick, selectedCard = false) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "solitaire-card";

    if (!card) {
      button.classList.add("empty");
      button.textContent = "＋";
    } else if (!card.faceUp) {
      button.classList.add("face-down");
      button.textContent = "✦";
      button.setAttribute("aria-label", "Face-down card");
    } else {
      button.textContent = label(card);
      if (card.red) button.classList.add("red");
      if (selectedCard) button.classList.add("selected");
    }

    button.addEventListener("click", onClick);
    return button;
  }

  function draw() {
    top.replaceChildren();

    const stockButton = makeCard(
      stock.length ? { faceUp: false } : null,
      () => {
        if (stock.length) {
          const card = stock.pop();
          card.faceUp = true;
          waste.push(card);
        } else if (waste.length) {
          stock = waste.reverse();
          waste = [];
          stock.forEach((card) => card.faceUp = false);
        }
        selected = null;
        draw();
      }
    );
    stockButton.setAttribute("aria-label", "Draw from stock");
    top.append(stockButton);

    const wasteTop = waste[waste.length - 1];
    top.append(makeCard(wasteTop || null, () => {
      if (wasteTop) {
        selected = { source: "waste", index: waste.length - 1 };
        draw();
      }
    }, selected?.source === "waste"));

    foundations.forEach((pile, index) => {
      const card = pile[pile.length - 1] || null;
      const button = makeCard(card, () => {
        if (selected) moveToFoundation(index);
      });
      button.setAttribute("aria-label", `Foundation ${index + 1}`);
      top.append(button);
    });

    tableau.replaceChildren();

    columns.forEach((column, columnIndex) => {
      const pile = document.createElement("div");
      pile.className = "solitaire-pile";

      if (!column.length) {
        pile.append(makeCard(null, () => {
          if (selected) moveToColumn(columnIndex);
        }));
      } else {
        column.forEach((card, cardIndex) => {
          const button = makeCard(
            card,
            () => {
              if (!card.faceUp) {
                if (cardIndex === column.length - 1) {
                  card.faceUp = true;
                  draw();
                }
                return;
              }

              if (selected) {
                if (selected.source === "column" &&
                    selected.column === columnIndex &&
                    selected.index === cardIndex) {
                  selected = null;
                  draw();
                  return;
                }
                if (moveToColumn(columnIndex)) return;
              }

              selected = {
                source: "column",
                column: columnIndex,
                index: cardIndex
              };
              draw();
            },
            selected?.source === "column" &&
            selected.column === columnIndex &&
            cardIndex >= selected.index
          );

          pile.append(button);
        });
      }

      tableau.append(pile);
    });

    if (foundations.every((pile) => pile.length === 13)) {
      won = true;
      message.textContent = "You won! All four suits are complete.";
    }
  }

  function selectedCards() {
    if (!selected) return [];
    if (selected.source === "waste") {
      return waste.slice(selected.index);
    }
    return columns[selected.column].slice(selected.index);
  }

  function removeSelected() {
    if (selected.source === "waste") {
      return waste.splice(selected.index);
    }

    const column = columns[selected.column];
    const cards = column.splice(selected.index);

    if (column.length && !column[column.length - 1].faceUp) {
      column[column.length - 1].faceUp = true;
    }

    return cards;
  }

  function moveToColumn(targetIndex) {
    if (!selected || won) return false;

    const moving = selectedCards();
    const first = moving[0];
    if (!first) return false;

    if (selected.source === "column" && selected.column === targetIndex) {
      return false;
    }

    const target = columns[targetIndex];
    const destination = target[target.length - 1];

    const valid = !destination
      ? first.rank === "K"
      : destination.faceUp &&
        destination.red !== first.red &&
        destination.value === first.value + 1;

    if (!valid) {
      message.textContent = "Place a King on an empty column, or alternate colors in descending order.";
      return false;
    }

    target.push(...removeSelected());
    selected = null;
    message.textContent = "Nice move.";
    draw();
    return true;
  }

  function moveToFoundation(targetIndex) {
    if (!selected || won) return false;

    const moving = selectedCards();
    if (moving.length !== 1) return false;

    const card = moving[0];
    const foundation = foundations[targetIndex];
    const topCard = foundation[foundation.length - 1];

    const valid = !topCard
      ? card.rank === "A"
      : topCard.suit === card.suit &&
        card.value === topCard.value + 1;

    if (!valid) {
      message.textContent = "Foundations must be built from Ace to King in the same suit.";
      return false;
    }

    foundation.push(...removeSelected());
    selected = null;
    message.textContent = "Foundation updated.";
    draw();
    return true;
  }

  function reset() {
    const deck = newDeck();
    stock = [];
    waste = [];
    foundations = [[], [], [], []];
    columns = Array.from({ length: 7 }, () => []);
    selected = null;
    won = false;

    for (let col = 0; col < 7; col++) {
      for (let row = 0; row <= col; row++) {
        const card = deck.pop();
        card.faceUp = row === col;
        columns[col].push(card);
      }
    }

    stock = deck;
    message.textContent = "Select a face-up card, then choose a destination pile.";
    draw();
  }

  controls.append(arcadeButton("New game", reset));
  reset();
}