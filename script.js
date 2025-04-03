/**
 * @typedef {Object} GameConfig
 * @property {number} gridSize
 * @property {string} imageUrl
 * @property {number} maxMoves
 */

/**
 * @typedef {Object} Position
 * @property {number} x
 * @property {number} y
 */

/**
 * @typedef {Object} GameState
 * @property {Position[]} pieces
 * @property {Position} emptyPosition
 * @property {number|null} timer
 * @property {number} seconds
 * @property {number} moves
 * @property {boolean} isPlaying
 */

/** @type {GameConfig} */
const config = {
    gridSize: 3,
    imageUrl: 'https://images.pexels.com/photos/3495051/pexels-photo-3495051.jpeg',
    maxMoves: 50
};

/** @type {GameState} */
const state = {
    pieces: [],
    emptyPosition: {x: 2, y: 2},
    timer: null,
    seconds: 0,
    moves: 0,
    isPlaying: false
};

// DOM Elements
const elements = {
    puzzleGrid: document.getElementById('puzzle-grid'),
    timerDisplay: document.getElementById('timer'),
    movesDisplay: document.getElementById('moves'),
    progressBar: document.getElementById('progress-bar'),
    shuffleBtn: document.getElementById('shuffle-btn'),
    victoryModal: document.getElementById('victory-modal'),
    finalTime: document.getElementById('final-time'),
    finalMoves: document.getElementById('final-moves'),
    playAgainBtn: document.getElementById('play-again-btn'),
    shareBtn: document.getElementById('share-btn')
};

// Initialize the game
function initGame() {
    generatePieces();
    renderPuzzle();
    setupEventListeners();
}

// Generate puzzle pieces
function generatePieces() {
    state.pieces = [];
    for (let y = 0; y < config.gridSize; y++) {
        for (let x = 0; x < config.gridSize; x++) {
            // Skip the empty position
            if (x === state.emptyPosition.x && y === state.emptyPosition.y) continue;
            state.pieces.push({x, y});
        }
    }
    shufflePieces();
}

// Shuffle puzzle pieces
function shufflePieces() {
    for (let i = state.pieces.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [state.pieces[i], state.pieces[j]] = [state.pieces[j], state.pieces[i]];
    }
    state.moves = 0;
    state.seconds = 0;
    updateUI();
}

// Render puzzle pieces to the DOM
function renderPuzzle() {
    elements.puzzleGrid.innerHTML = '';
    let pieceIndex = 0;
    
    for (let y = 0; y < config.gridSize; y++) {
        for (let x = 0; x < config.gridSize; x++) {
            const cell = document.createElement('div');
            cell.className = 'aspect-square flex items-center justify-center';
            
            if (x === state.emptyPosition.x && y === state.emptyPosition.y) {
                cell.className += ' empty-slot';
                cell.dataset.x = x;
                cell.dataset.y = y;
            } else {
                const piece = state.pieces[pieceIndex++];
                cell.className += ' puzzle-piece';
                cell.style.backgroundImage = `url(${config.imageUrl})`;
                cell.style.backgroundPosition = `${(piece.x / (config.gridSize - 1)) * 100}% ${(piece.y / (config.gridSize - 1)) * 100}%`;
                cell.draggable = true;
                cell.dataset.x = piece.x;
                cell.dataset.y = piece.y;
                cell.dataset.currentX = x;
                cell.dataset.currentY = y;
                cell.addEventListener('dragstart', handleDragStart);
            }
            
            elements.puzzleGrid.appendChild(cell);
        }
    }
    
    // Add drop event listeners to empty slots
    document.querySelectorAll('.empty-slot').forEach(slot => {
        slot.addEventListener('dragover', handleDragOver);
        slot.addEventListener('drop', handleDrop);
    });
}

// Handle drag start
function handleDragStart(e) {
    e.dataTransfer.setData('text/plain', JSON.stringify({
        x: parseInt(e.target.dataset.currentX),
        y: parseInt(e.target.dataset.currentY)
    }));
}

// Handle drag over
function handleDragOver(e) {
    e.preventDefault();
}

// Handle drop
function handleDrop(e) {
    e.preventDefault();
    if (!state.isPlaying) {
        startGame();
    }
    
    const fromPos = JSON.parse(e.dataTransfer.getData('text/plain'));
    const toPos = {
        x: parseInt(e.target.dataset.x),
        y: parseInt(e.target.dataset.y)
    };
    
    // Check if the move is valid (adjacent to empty slot)
    if (isValidMove(fromPos, toPos)) {
        // Update piece positions
        const pieceIndex = state.pieces.findIndex(p => 
            p.x === fromPos.x && p.y === fromPos.y
        );
        
        if (pieceIndex !== -1) {
            // Move the piece
            state.pieces[pieceIndex].x = toPos.x;
            state.pieces[pieceIndex].y = toPos.y;
            state.emptyPosition = fromPos;
            state.moves++;
            
            // Re-render the puzzle
            renderPuzzle();
            updateUI();
            
            // Check for victory
            if (checkVictory()) {
                endGame();
            }
        }
    }
}

// Check if move is valid
function isValidMove(fromPos, toPos) {
    return (
        (Math.abs(fromPos.x - toPos.x) === 1 && fromPos.y === toPos.y) ||
        (Math.abs(fromPos.y - toPos.y) === 1 && fromPos.x === toPos.x)
    );
}

// Check if puzzle is solved
function checkVictory() {
    return state.pieces.every(piece => 
        piece.x === parseInt(piece.dataset?.currentX) && 
        piece.y === parseInt(piece.dataset?.currentY)
    );
}

// Start the game timer
function startGame() {
    if (state.isPlaying) return;
    state.isPlaying = true;
    state.timer = setInterval(() => {
        state.seconds++;
        updateUI();
    }, 1000);
}

// End the game
function endGame() {
    clearInterval(state.timer);
    state.isPlaying = false;
    showVictoryModal();
    saveHighScore();
}

// Show victory modal
function showVictoryModal() {
    elements.finalTime.textContent = formatTime(state.seconds);
    elements.finalMoves.textContent = state.moves;
    elements.victoryModal.classList.remove('hidden');
}

// Save high score to local storage
function saveHighScore() {
    const highScores = JSON.parse(localStorage.getItem('puzzleHighScores') || '[]');
    highScores.push({
        time: state.seconds,
        moves: state.moves,
        date: new Date().toISOString()
    });
    localStorage.setItem('puzzleHighScores', JSON.stringify(highScores));
}

// Update UI elements
function updateUI() {
    // Update timer
    elements.timerDisplay.textContent = formatTime(state.seconds);
    
    // Update moves
    elements.movesDisplay.textContent = state.moves;
    
    // Update progress bar
    const progressPercent = Math.min(100, (state.moves / config.maxMoves) * 100);
    elements.progressBar.style.width = `${progressPercent}%`;
}

// Format time as MM:SS
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
}

// Setup event listeners
function setupEventListeners() {
    // Shuffle button
    elements.shuffleBtn.addEventListener('click', () => {
        shufflePieces();
        renderPuzzle();
        if (state.isPlaying) {
            clearInterval(state.timer);
            state.isPlaying = false;
        }
    });
    
    // View score button
    elements.viewScoreBtn.addEventListener('click', redirectToScore);
    
    // Play again button
    elements.playAgainBtn.addEventListener('click', () => {
        elements.victoryModal.classList.add('hidden');
        shufflePieces();
        renderPuzzle();
    });
}

// Initialize the game when DOM is loaded
document.addEventListener('DOMContentLoaded', initGame);