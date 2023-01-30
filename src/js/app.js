import { allWords, dictionary } from "./appSetup.js";
import {
  DANCE_ANIMATION_DURATION,
  FLIP_ANIMATION_DURATION,
  WINNING_ALERTS,
  WORDLE_LENGTH,
} from "./config.js";
const guessGrid = document.querySelector("[data-guess-grid]");
const keyboardGrid = document.querySelector("[data-keyboard]");
const alertContainer = document.querySelector("[data-alert-container]");
const howToPlayIcon = document.querySelector(".how-to-play-icon");
const howToPlayModal = document.querySelector("#how-to-play-modal");
const overlay = document.querySelector(".overlay");
const closeHTPBtn = document.querySelector(".close-htp-btn");
const closeStatusBtn = document.querySelector(".close-status-btn");
const statusModal = document.getElementById("status-modal");
const statusMessage = document.querySelector(".status-message");
const tillTheWordle = document.querySelector(".till-the-wordle");
const playAgainBtn = document.querySelector(".play-again-btn");

let gameState = {
  guessesLetters: [],
  boardState: [],
  keyBoardState: {},
};

function showOrHideHowToPlayModal(modalKind, showOrHide) {
  const showOrHideLower = showOrHide.toLowerCase();
  if (showOrHideLower === "show") {
    modalKind.classList.add("active");
    overlay.classList.add("active");
  }
  if (showOrHideLower === "hide") {
    modalKind.classList.remove("active");
    overlay.classList.remove("active");
  }
}

function manipulateHowToPlayModal() {
  const allModals = Array.from(document.querySelectorAll(".modal"));
  howToPlayIcon.addEventListener("click", () =>
    showOrHideHowToPlayModal(howToPlayModal, "show")
  );
  closeHTPBtn.addEventListener("click", () =>
    showOrHideHowToPlayModal(howToPlayModal, "hide")
  );
  closeStatusBtn.addEventListener("click", () => {
    showOrHideHowToPlayModal(statusModal, "hide");
  });
  overlay.addEventListener("click", () => {
    const activeModal = allModals.find((modal) =>
      modal.classList.contains("active")
    );
    if (activeModal == null) return;
    showOrHideHowToPlayModal(activeModal, "hide");
  });
  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      const activeModal = allModals.find((modal) =>
        modal.classList.contains("active")
      );
      if (activeModal == null) return;
      showOrHideHowToPlayModal(activeModal, "hide");
    }
  });
}

function setTheWordle() {
  window.addEventListener("load", () => {
    const randomIndex = Math.floor(Math.random() * allWords.length);
    gameState.solution = allWords.at(randomIndex);
  });
}

function startInteraction() {
  document.addEventListener("click", handleMouseClick);
  document.addEventListener("keydown", handleKeyPress);
}

function stopInteraction() {
  document.removeEventListener("click", handleMouseClick);
  document.removeEventListener("keydown", handleKeyPress);
}

function handleMouseClick(event) {
  const clickEvent = event.target;
  if (clickEvent.matches("[data-key]")) return pressKey(clickEvent.dataset.key);
  if (clickEvent.matches("[data-delete]")) return deleteKey();
  if (clickEvent.matches("[data-enter]")) return submitGuess();
}

function handleKeyPress(event) {
  if (event.ctrlKey) return;
  const keyPressed = event.key;
  // Any key that is a single letter and matches to this regex
  if (keyPressed.match(/^[A-Za-z]$/)) return pressKey(keyPressed);
  if (keyPressed === "Backspace" || keyPressed === "Delete") return deleteKey();
  if (keyPressed === "Enter") return submitGuess();
}

function pressKey(key) {
  const activeTiles = getActiveTiles();
  if (activeTiles.length >= WORDLE_LENGTH) return;
  const nextTile = guessGrid.querySelector(":not([data-letter])");
  nextTile.dataset.letter = key;
  nextTile.dataset.state = "active";
  nextTile.textContent = key;
  nextTile.classList.add("popup");
  nextTile.addEventListener(
    "animationend",
    () => {
      nextTile.classList.remove("popup");
    },
    { once: true }
  );
}

function deleteKey() {
  const activeTiles = [...getActiveTiles()];
  // Get the last tile and destructuring it from the returning array
  const [lastTile] = activeTiles.splice(-1);
  if (lastTile == null) return;
  // lastTile.removeAttribute("data-state");
  delete lastTile.dataset.letter;
  delete lastTile.dataset.state;
  lastTile.textContent = "";
}

function submitGuess() {
  const activeTiles = [...getActiveTiles()];
  // Check if the word length is equal 5
  if (activeTiles.length === 0) return showAlert("Type some letters first!");
  if (activeTiles.length < WORDLE_LENGTH && activeTiles.length !== 0) {
    showAlert("Not enough letters!");
    shakeTiles(activeTiles);
    return;
  }
  // If the length of the word is equal 5 then do this
  const userGuess = activeTiles
    .map((activeTile) => activeTile.dataset.letter)
    .reduce((userGuess, userGuessLetter) => userGuess + userGuessLetter, "");
  const sameWordInDictionary = dictionary.find((word) => word === userGuess);
  if (sameWordInDictionary == null) {
    showAlert("Not in word list");
    shakeTiles(activeTiles);
    return;
  }
  if (userGuess !== gameState.solution) {
    stopInteraction();
    flipTiles(activeTiles, userGuess);
    return;
  }
  stopInteraction();
  flipTiles(activeTiles, userGuess);
}

function getActiveTiles() {
  return guessGrid.querySelectorAll('[data-state="active"]');
}

function showAlert(alertMessage, disappearingTime = 1200) {
  const alertElement = document.createElement("div");
  alertElement.textContent = alertMessage;
  alertElement.classList.add("alert");
  alertContainer.prepend(alertElement);
  if (disappearingTime == null) return;
  setTimeout(() => {
    alertElement.classList.add("hide");
    alertElement.addEventListener("transitionend", () => {
      alertElement.remove();
    });
  }, disappearingTime);
}

function shakeTiles(tiles) {
  tiles.forEach((tile) => {
    tile.classList.add("shake");
    tile.addEventListener(
      "animationend",
      () => {
        tile.classList.remove("shake");
      },
      { once: true }
    );
  });
}

function flipTiles(tiles, userGuess) {
  const wordleLetters = gameState.solution.split("");
  tiles.forEach((tile, index) => {
    const tileLetter = tile.dataset.letter;
    const correspondingKey = document.querySelector(`[data-key=${tileLetter}]`);
    setTimeout(() => {
      tile.classList.add("flip");
    }, (index * FLIP_ANIMATION_DURATION) / 2);
    tile.addEventListener(
      "transitionend",
      () => {
        tile.classList.remove("flip");
        if (tileLetter === wordleLetters.at(index)) {
          tile.dataset.state = "correct";
          correspondingKey.dataset.state = "correct";
        } else if (
          wordleLetters.includes(tileLetter) &&
          tileLetter !== wordleLetters.at(index)
        ) {
          tile.dataset.state = "wrong-location";
          correspondingKey.dataset.state = "wrong-location";
        } else {
          tile.dataset.state = "wrong";
          correspondingKey.dataset.state = "wrong";
        }

        gameState.boardState.push(tile.dataset.state);
        gameState.guessesLetters.push(tileLetter);
        gameState.keyBoardState[correspondingKey.textContent] =
          correspondingKey.dataset.state;
        playWithLocalStorage("set");

        if (index === wordleLetters.length - 1) {
          tile.addEventListener(
            "transitionend",
            () => {
              startInteraction();
              checkWinOrLose(tiles, userGuess);
            },
            { once: true }
          );
        }
      },
      { once: true }
    );
  });
}

function checkWinOrLose(tiles, userGuess) {
  if (userGuess === gameState.solution) {
    showAlert(
      WINNING_ALERTS.at(Math.floor(Math.random() * WINNING_ALERTS.length))
    );
    danceTiles(tiles);
    gameState.gameStatus = "win";
    playWithLocalStorage("set");
    showOrHideHowToPlayModal(statusModal, "show");
    statusMessage.textContent = "You win 🎉";
    tillTheWordle.textContent = "You've guessed the write wordle";
    stopInteraction();
  }

  const remainingTiles = guessGrid.querySelectorAll(":not([data-letter])");
  if (remainingTiles.length === 0 && userGuess !== gameState.solution) {
    gameState.gameStatus = "lost";
    playWithLocalStorage("set");
    showOrHideHowToPlayModal(statusModal, "show");
    statusMessage.textContent = "You Lost 😥";
    tillTheWordle.textContent = `The wordle was ${gameState.solution.toUpperCase()}`;
    stopInteraction();
  }
}

function danceTiles(tiles) {
  tiles.forEach((tile, index) => {
    setTimeout(() => {
      tile.classList.add("dance");
      tile.addEventListener(
        "animationend",
        () => {
          tile.classList.remove("dance");
        },
        { once: true }
      );
    }, (index * DANCE_ANIMATION_DURATION) / 5);
  });
}

function playWithLocalStorage(playState) {
  const playStateLower = playState.toLowerCase();
  if (playStateLower === "set")
    localStorage.setItem("game-state", JSON.stringify(gameState));
  if (playStateLower === "get") return localStorage.getItem("game-state");
}

function initEverythingBack() {
  const newGameState = JSON.parse(playWithLocalStorage("get"));
  if (newGameState == null) return;
  gameState = newGameState;
  const allTiles = Array.from(guessGrid.querySelectorAll(".tile")).slice(
    0,
    gameState.boardState.length
  );
  allTiles.forEach((tile, index) => {
    tile.dataset.state = gameState.boardState[index];
    tile.dataset.letter = gameState.guessesLetters[index];
    tile.textContent = gameState.guessesLetters[index];
  });
  Object.keys(gameState.keyBoardState).forEach((key) => {
    keyboardGrid.querySelector(`[data-key=${key}]`).dataset.state =
      gameState.keyBoardState[key];
  });
  if (gameState.gameStatus === "lost") {
    showAlert(gameState.solution.toUpperCase(), null);
    stopInteraction();
  }
  if (gameState.gameStatus === "win") {
    danceTiles(allTiles.slice(Math.max(allTiles.length - 5, 1)));
    showAlert(
      WINNING_ALERTS.at(Math.floor(Math.random() * WINNING_ALERTS.length))
    );
    stopInteraction();
  }
}

function newGame() {
  localStorage.clear();
  location.reload();
}

function init() {
  manipulateHowToPlayModal();
  setTheWordle();
  startInteraction();
  window.addEventListener("load", initEverythingBack);
  playAgainBtn.addEventListener("click", newGame);
}

init();
