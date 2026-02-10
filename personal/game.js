const I18N = {
  en: {
    selectLang: "Select language",
    english: "English",
    portuguese: "Português (Brasil)",
    instructions: "Solve the puzzle!",
    completed: "Puzzle completed!",
    question: "will you be Cephas' valentine?",
    yes: "YES",
    no: "NO",
    finalMsg: "please text Cephas with your schedule for Saturday",
    reset: "Restart",
    ok: "OK"
  },
  "pt-BR": {
    selectLang: "Selecione o idioma",
    english: "English",
    portuguese: "Português (Brasil)",
    instructions: "Monte o quebra-cabeça!",
    completed: "Quebra-cabeça concluído!",
    question: "você quer ser o par do Cephas no Dia dos Namorados?",
    yes: "SIM",
    no: "NÃO",
    finalMsg: "por favor, mande mensagem para o Cephas com seus horários para sábado",
    reset: "Reiniciar",
    ok: "OK"
  }
};

const PUZZLE_IMAGE_SRC = "chibi_us.png";
const REVEAL_IMAGE_SRC = "neptune.png";

const COLS = 4;
const ROWS = 3;
const SNAP_THRESHOLD = 20;
const COMPLETION_FADE_MS = 280;
const NO_FLEE_RADIUS = 80;

const appEl = document.getElementById("app");
const htmlEl = document.documentElement;
const langOverlayEl = document.getElementById("langOverlay");
const langTitleEl = document.getElementById("langTitle");
const langEnBtn = document.getElementById("langEnBtn");
const langPtBtn = document.getElementById("langPtBtn");

const instructionsTextEl = document.getElementById("instructionsText");
const restartBtn = document.getElementById("restartBtn");

const puzzleSceneEl = document.getElementById("puzzleScene");
const puzzleAreaEl = document.getElementById("puzzleArea");
const boardEl = document.getElementById("board");
const boardPiecesEl = document.getElementById("boardPieces");
const trayEl = document.getElementById("tray");
const pieceLayerEl = document.getElementById("pieceLayer");

const revealSceneEl = document.getElementById("revealScene");
const revealWrapEl = document.getElementById("revealWrap");
const revealImageEl = document.getElementById("revealImage");
const questionTextEl = document.getElementById("questionText");
const choiceZoneEl = document.getElementById("choiceZone");
const yesBtn = document.getElementById("yesBtn");
const noSlotEl = document.getElementById("noSlot");
const noBtn = document.getElementById("noBtn");

const finalDialogEl = document.getElementById("finalDialog");
const finalMsgTextEl = document.getElementById("finalMsgText");
const finalOkBtn = document.getElementById("finalOkBtn");

const state = {
  lang: "en",
  languageChosen: false,
  img: null,
  boardRect: { x: 0, y: 0, w: 0, h: 0 },
  trayRect: { x: 0, y: 0, w: 0, h: 0 },
  pieceW: 0,
  pieceH: 0,
  pieces: [],
  lockedCount: 0,
  drag: null,
  completed: false,
  noScale: 1
};

init();

function init() {
  boardEl.style.setProperty("--cols", String(COLS));
  boardEl.style.setProperty("--rows", String(ROWS));

  revealImageEl.src = REVEAL_IMAGE_SRC;
  setupListeners();

  const savedLang = localStorage.getItem("jigsaw_lang");
  if (savedLang && I18N[savedLang]) {
    setLanguage(savedLang);
  } else {
    setLanguage("en");
  }
  showLanguageOverlay();

  loadPuzzleImage();
}

function setupListeners() {
  langEnBtn.addEventListener("click", () => chooseLanguage("en"));
  langPtBtn.addEventListener("click", () => chooseLanguage("pt-BR"));

  restartBtn.addEventListener("click", restartPuzzle);
  yesBtn.addEventListener("click", onYesClick);
  finalOkBtn.addEventListener("click", closeFinalDialog);

  // NO-button flee logic and non-selectable behavior.
  noBtn.disabled = true;
  noBtn.setAttribute("aria-disabled", "true");
  noBtn.setAttribute("tabindex", "-1");
  noBtn.addEventListener("click", (ev) => ev.preventDefault());
  noBtn.addEventListener("pointerdown", (ev) => ev.preventDefault());
  noBtn.addEventListener("keydown", (ev) => ev.preventDefault());

  revealWrapEl.addEventListener("mousemove", onRevealMouseMove);
  revealWrapEl.addEventListener("touchmove", (ev) => {
    ev.preventDefault();
  }, { passive: false });

  window.addEventListener("resize", onResize);
  window.addEventListener("pointermove", onPointerMove);
  window.addEventListener("pointerup", onPointerUp);
}

function chooseLanguage(langCode) {
  setLanguage(langCode);
  state.languageChosen = true;
  localStorage.setItem("jigsaw_lang", langCode);
  hideLanguageOverlay();
}

// i18n update function.
function setLanguage(langCode) {
  state.lang = I18N[langCode] ? langCode : "en";
  const t = I18N[state.lang];

  htmlEl.lang = state.lang;
  langTitleEl.textContent = t.selectLang;
  langEnBtn.textContent = t.english;
  langPtBtn.textContent = t.portuguese;

  instructionsTextEl.textContent = state.completed ? t.completed : t.instructions;
  restartBtn.textContent = t.reset;
  questionTextEl.textContent = t.question;
  yesBtn.textContent = t.yes;
  noBtn.textContent = t.no;
  finalMsgTextEl.textContent = t.finalMsg;
  finalOkBtn.textContent = t.ok;
}

function showLanguageOverlay() {
  langOverlayEl.classList.remove("hidden");
  langOverlayEl.setAttribute("aria-hidden", "false");
}

function hideLanguageOverlay() {
  langOverlayEl.classList.add("hidden");
  langOverlayEl.setAttribute("aria-hidden", "true");
}

function loadPuzzleImage() {
  const img = new Image();
  img.onload = () => {
    state.img = img;
    restartPuzzle();
  };
  img.onerror = () => {
    console.error("Failed to load puzzle image:", PUZZLE_IMAGE_SRC);
  };
  img.src = PUZZLE_IMAGE_SRC;
}

function restartPuzzle() {
  if (!state.img) {
    return;
  }

  document.body.classList.remove("valentine");
  state.completed = false;
  state.lockedCount = 0;
  state.drag = null;

  closeFinalDialog();
  revealSceneEl.classList.add("hidden");
  revealSceneEl.setAttribute("aria-hidden", "true");
  puzzleSceneEl.classList.remove("hidden", "fading");

  createBoardLayout();
  createPieces();
  setLanguage(state.lang);
  resetNoButtonPosition();
}

function createBoardLayout() {
  const areaW = puzzleAreaEl.clientWidth;
  const areaH = puzzleAreaEl.clientHeight;

  const trayH = Math.round(areaH * 0.44);
  const topPad = 12;
  const trayGap = 14;
  const usableH = Math.max(120, areaH - trayH - trayGap - topPad);
  const maxBoardW = areaW * 0.84;
  const maxBoardH = usableH;
  const imgRatio = state.img.width / state.img.height;

  let boardW = maxBoardW;
  let boardH = boardW / imgRatio;

  if (boardH > maxBoardH) {
    boardH = maxBoardH;
    boardW = boardH * imgRatio;
  }

  const boardX = Math.round((areaW - boardW) / 2);
  const boardY = Math.max(topPad, Math.round((usableH - boardH) / 2) + topPad);
  const trayTop = Math.max(boardY + boardH + trayGap, areaH - trayH);

  boardEl.style.left = `${boardX}px`;
  boardEl.style.top = `${boardY}px`;
  boardEl.style.width = `${Math.round(boardW)}px`;
  boardEl.style.height = `${Math.round(boardH)}px`;

  trayEl.style.top = `${trayTop}px`;
  trayEl.style.height = `${trayH}px`;

  state.boardRect = { x: boardX, y: boardY, w: boardW, h: boardH };
  state.trayRect = { x: 0, y: trayTop, w: areaW, h: trayH };
  state.pieceW = boardW / COLS;
  state.pieceH = boardH / ROWS;
}

// Puzzle piece generation.
function createPieces() {
  state.pieces = [];
  boardPiecesEl.innerHTML = "";
  pieceLayerEl.innerHTML = "";

  const indexes = [];
  for (let i = 0; i < COLS * ROWS; i += 1) {
    indexes.push(i);
  }
  shuffle(indexes);

  indexes.forEach((pieceId) => {
    const col = pieceId % COLS;
    const row = Math.floor(pieceId / COLS);

    const pieceEl = document.createElement("div");
    pieceEl.className = "piece";
    pieceEl.style.width = `${state.pieceW}px`;
    pieceEl.style.height = `${state.pieceH}px`;
    pieceEl.style.backgroundImage = `url(${PUZZLE_IMAGE_SRC})`;
    pieceEl.style.backgroundSize = `${state.boardRect.w}px ${state.boardRect.h}px`;
    pieceEl.style.backgroundPosition = `${-col * state.pieceW}px ${-row * state.pieceH}px`;

    const trayPos = randomTrayPosition();
    setPiecePosition(pieceEl, trayPos.x, trayPos.y);

    const piece = {
      id: pieceId,
      row,
      col,
      x: trayPos.x,
      y: trayPos.y,
      locked: false,
      el: pieceEl,
      correctX: state.boardRect.x + col * state.pieceW,
      correctY: state.boardRect.y + row * state.pieceH
    };

    pieceEl.addEventListener("pointerdown", (ev) => onPiecePointerDown(ev, piece));
    pieceLayerEl.appendChild(pieceEl);
    state.pieces.push(piece);
  });
}

function onPiecePointerDown(ev, piece) {
  if (piece.locked || state.completed || !state.languageChosen) {
    return;
  }

  ev.preventDefault();
  const rect = piece.el.getBoundingClientRect();
  const areaRect = puzzleAreaEl.getBoundingClientRect();

  state.drag = {
    piece,
    pointerId: ev.pointerId,
    offsetX: ev.clientX - rect.left,
    offsetY: ev.clientY - rect.top,
    areaLeft: areaRect.left,
    areaTop: areaRect.top
  };

  piece.el.classList.add("dragging");
  piece.el.style.zIndex = "60";
}

// Drag + snap logic.
function onPointerMove(ev) {
  if (!state.drag || ev.pointerId !== state.drag.pointerId) {
    return;
  }

  ev.preventDefault();
  const { piece, offsetX, offsetY, areaLeft, areaTop } = state.drag;
  const x = ev.clientX - areaLeft - offsetX;
  const y = ev.clientY - areaTop - offsetY;

  setPiecePosition(piece.el, x, y);
  piece.x = x;
  piece.y = y;
}

function onPointerUp(ev) {
  if (!state.drag || ev.pointerId !== state.drag.pointerId) {
    return;
  }

  const { piece } = state.drag;
  piece.el.classList.remove("dragging");
  piece.el.style.zIndex = "20";

  const pieceRect = { x: piece.x, y: piece.y, w: state.pieceW, h: state.pieceH };
  const cellRect = { x: piece.correctX, y: piece.correctY, w: state.pieceW, h: state.pieceH };
  const pieceCx = pieceRect.x + pieceRect.w * 0.5;
  const pieceCy = pieceRect.y + pieceRect.h * 0.5;
  const cellCx = cellRect.x + cellRect.w * 0.5;
  const cellCy = cellRect.y + cellRect.h * 0.5;
  const snapRadius = Math.max(state.pieceW, state.pieceH) * 0.45;
  const centerDistance = Math.hypot(pieceCx - cellCx, pieceCy - cellCy);

  const overlapW = Math.max(
    0,
    Math.min(pieceRect.x + pieceRect.w, cellRect.x + cellRect.w) - Math.max(pieceRect.x, cellRect.x)
  );
  const overlapH = Math.max(
    0,
    Math.min(pieceRect.y + pieceRect.h, cellRect.y + cellRect.h) - Math.max(pieceRect.y, cellRect.y)
  );
  const overlapArea = overlapW * overlapH;
  const pieceArea = pieceRect.w * pieceRect.h;
  const overlapRatio = pieceArea > 0 ? overlapArea / pieceArea : 0;

  if (centerDistance <= snapRadius || overlapRatio >= 0.3) {
    lockPiece(piece);
  }

  state.drag = null;
}

function lockPiece(piece) {
  if (piece.locked) {
    return;
  }

  piece.locked = true;
  piece.x = piece.correctX;
  piece.y = piece.correctY;
  piece.el.classList.add("locked");
  piece.el.style.zIndex = "30";
  if (piece.el.parentElement !== boardPiecesEl) {
    boardPiecesEl.appendChild(piece.el);
  }
  piece.el.style.left = `${piece.col * state.pieceW}px`;
  piece.el.style.top = `${piece.row * state.pieceH}px`;
  state.lockedCount += 1;

  // Completion trigger.
  if (state.lockedCount === state.pieces.length) {
    onPuzzleCompleted();
  }
}

function onPuzzleCompleted() {
  state.completed = true;
  instructionsTextEl.textContent = I18N[state.lang].completed;
  puzzleSceneEl.classList.add("fading");

  window.setTimeout(() => {
    puzzleSceneEl.classList.add("hidden");
    revealSceneEl.classList.remove("hidden");
    revealSceneEl.setAttribute("aria-hidden", "false");
    document.body.classList.add("valentine");
    resetNoButtonPosition();
  }, COMPLETION_FADE_MS);
}

function onYesClick() {
  if (revealSceneEl.classList.contains("hidden")) {
    return;
  }
  finalDialogEl.classList.remove("hidden");
  finalDialogEl.setAttribute("aria-hidden", "false");
}

function closeFinalDialog() {
  finalDialogEl.classList.add("hidden");
  finalDialogEl.setAttribute("aria-hidden", "true");
}

function randomTrayPosition() {
  const minX = 8;
  const maxX = Math.max(minX, state.trayRect.w - state.pieceW - 8);
  const minY = state.trayRect.y + 8;
  const maxY = Math.max(minY, state.trayRect.y + state.trayRect.h - state.pieceH - 8);

  return {
    x: randomInt(minX, maxX),
    y: randomInt(minY, maxY)
  };
}

function setPiecePosition(pieceEl, x, y) {
  const maxX = puzzleAreaEl.clientWidth - state.pieceW;
  const maxY = puzzleAreaEl.clientHeight - state.pieceH;
  const clampedX = clamp(x, 0, maxX);
  const clampedY = clamp(y, 0, maxY);
  pieceEl.style.left = `${clampedX}px`;
  pieceEl.style.top = `${clampedY}px`;
}

// NO-button flee logic.
function onRevealMouseMove(ev) {
  if (revealSceneEl.classList.contains("hidden")) {
    return;
  }

  const noRect = noBtn.getBoundingClientRect();
  const dx = ev.clientX - (noRect.left + noRect.width * 0.5);
  const dy = ev.clientY - (noRect.top + noRect.height * 0.5);

  if (Math.hypot(dx, dy) <= NO_FLEE_RADIUS) {
    moveNoButton();
  }
}

function moveNoButton() {
  const zoneRect = choiceZoneEl.getBoundingClientRect();
  const btnRect = noBtn.getBoundingClientRect();
  state.noScale = Math.max(0.45, state.noScale * 0.9);
  noBtn.style.setProperty("--noScale", String(state.noScale));

  const effectiveW = btnRect.width * state.noScale;
  const effectiveH = btnRect.height * state.noScale;
  const maxX = Math.max(0, zoneRect.width - effectiveW);
  const maxY = Math.max(0, zoneRect.height - effectiveH);

  const nextX = randomInt(0, maxX);
  const nextY = randomInt(0, maxY);

  noBtn.style.left = `${nextX}px`;
  noBtn.style.top = `${nextY}px`;
}

function resetNoButtonPosition() {
  state.noScale = 1;
  noBtn.style.setProperty("--noScale", String(state.noScale));

  const zoneH = choiceZoneEl.clientHeight;
  const slotLeft = noSlotEl.offsetLeft;
  const noHeight = noBtn.offsetHeight;

  const nextLeft = slotLeft;
  const nextTop = Math.max(0, Math.round((zoneH - noHeight) / 2));

  noBtn.style.left = `${nextLeft}px`;
  noBtn.style.top = `${nextTop}px`;
}

function onResize() {
  if (!state.img || state.completed) {
    return;
  }

  createBoardLayout();
  state.pieces.forEach((piece) => {
    piece.correctX = state.boardRect.x + piece.col * state.pieceW;
    piece.correctY = state.boardRect.y + piece.row * state.pieceH;

    piece.el.style.width = `${state.pieceW}px`;
    piece.el.style.height = `${state.pieceH}px`;
    piece.el.style.backgroundSize = `${state.boardRect.w}px ${state.boardRect.h}px`;
    piece.el.style.backgroundPosition = `${-piece.col * state.pieceW}px ${-piece.row * state.pieceH}px`;

    if (piece.locked) {
      piece.el.style.left = `${piece.col * state.pieceW}px`;
      piece.el.style.top = `${piece.row * state.pieceH}px`;
    } else {
      const pos = randomTrayPosition();
      piece.x = pos.x;
      piece.y = pos.y;
      setPiecePosition(piece.el, pos.x, pos.y);
    }
  });
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

function randomInt(min, max) {
  return Math.floor(min + Math.random() * (max - min + 1));
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}
