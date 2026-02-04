
import { SymbolType, GamePhase, Player, BoardState, GameState } from '../types';

export const WINNING_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // Cols
  [0, 4, 8], [2, 4, 6]             // Diagonals
];

export const checkWinner = (board: BoardState): boolean => {
  for (const line of WINNING_LINES) {
    const [a, b, c] = line;
    if (
      board[a] === SymbolType.SLASH &&
      board[b] === SymbolType.SLASH &&
      board[c] === SymbolType.SLASH
    ) {
      return true;
    }
  }
  return false;
};

export const isValidMove = (
  state: GameState,
  index: number,
  player: Player
): boolean => {
  const { board, phase, lastMoveIndex, winner } = state;
  if (winner) return false;

  const currentSymbol = board[index];
  
  // Cannot play on Block
  if (currentSymbol === SymbolType.BLOCK) return false;

  const opponentSymbol = player === Player.ONE ? SymbolType.HORIZONTAL : SymbolType.VERTICAL;

  // Ko Rule: Cannot play on the spot where the opponent just played
  if (index === lastMoveIndex) return false;

  if (phase === GamePhase.EXPANSION) {
    if (currentSymbol === null) return true;
    if (currentSymbol === opponentSymbol) return true;
    return false;
  } else {
    // BATTLE PHASE
    // Normally, board is full. But with Blocks/Removals, spots can open up.
    // Allow playing on NULL spots in Battle phase now.
    if (currentSymbol === null) return true;
    
    if (currentSymbol === SymbolType.PLUS) return true;
    if (currentSymbol === opponentSymbol) return true;
    return false;
  }
};

export const executeMove = (
  state: GameState,
  index: number
): GameState => {
  const { board, currentPlayer, phase } = state;
  const newBoard = [...board];
  const currentSymbol = board[index];
  const playerSymbol = currentPlayer === Player.ONE ? SymbolType.VERTICAL : SymbolType.HORIZONTAL;
  const opponentSymbol = currentPlayer === Player.ONE ? SymbolType.HORIZONTAL : SymbolType.VERTICAL;

  if (phase === GamePhase.EXPANSION) {
    if (currentSymbol === null) {
      newBoard[index] = playerSymbol;
    } else if (currentSymbol === opponentSymbol) {
      newBoard[index] = SymbolType.PLUS;
    }
  } else {
    // BATTLE PHASE
    if (currentSymbol === null) {
      // Allow placing base symbol on empty spots in Battle Phase (due to removal mechanics)
      newBoard[index] = playerSymbol;
    } else if (currentSymbol === SymbolType.PLUS) {
      newBoard[index] = SymbolType.SLASH;
    } else if (currentSymbol === opponentSymbol) {
      newBoard[index] = SymbolType.PLUS;
    }
  }

  if (checkWinner(newBoard)) {
    return { ...state, board: newBoard, winner: currentPlayer, lastMoveIndex: index, winReason: "Three Slashes" };
  }

  let newPhase = phase;
  // If in expansion and board fills up, switch to battle
  if (phase === GamePhase.EXPANSION && newBoard.indexOf(null) === -1) {
     newPhase = GamePhase.BATTLE;
  }

  const nextPlayer = currentPlayer === Player.ONE ? Player.TWO : Player.ONE;
  return {
    ...state,
    board: newBoard,
    currentPlayer: nextPlayer,
    phase: newPhase,
    lastMoveIndex: index
  };
};

export const executeBlockAction = (
  state: GameState,
  index: number,
  action: 'PLACE' | 'NEUTRALIZE'
): GameState => {
  const newBoard = [...state.board];
  const nextPlayer = state.currentPlayer === Player.ONE ? Player.TWO : Player.ONE;
  let p1Block = state.p1BlockUsed;
  let p2Block = state.p2BlockUsed;

  if (action === 'PLACE') {
    newBoard[index] = SymbolType.BLOCK;
    if (state.currentPlayer === Player.ONE) p1Block = true;
    else p2Block = true;
  } else if (action === 'NEUTRALIZE') {
    // Neutralizing clears the cell completely, allowing new moves
    newBoard[index] = null;
    if (state.currentPlayer === Player.ONE) p1Block = true;
    else p2Block = true;
  }

  return {
    ...state,
    board: newBoard,
    currentPlayer: nextPlayer,
    p1BlockUsed: p1Block,
    p2BlockUsed: p2Block,
    lastMoveIndex: index 
  };
};

export const executeRemoveAction = (
  state: GameState,
  index: number,
  subOption?: 'KEEP_V' | 'KEEP_H' 
): GameState => {
  const newBoard = [...state.board];
  let p1Remove = state.p1RemoveUsed;
  let p2Remove = state.p2RemoveUsed;

  const symbol = newBoard[index];

  if (symbol === SymbolType.SLASH) {
    newBoard[index] = SymbolType.PLUS;
  } else if (symbol === SymbolType.PLUS) {
    if (subOption === 'KEEP_V') newBoard[index] = SymbolType.VERTICAL;
    else if (subOption === 'KEEP_H') newBoard[index] = SymbolType.HORIZONTAL;
  } else if (symbol === SymbolType.VERTICAL || symbol === SymbolType.HORIZONTAL) {
    newBoard[index] = null;
  }

  if (state.currentPlayer === Player.ONE) p1Remove = true;
  else p2Remove = true;

  return {
    ...state,
    board: newBoard,
    p1RemoveUsed: p1Remove,
    p2RemoveUsed: p2Remove,
    // lastMoveIndex doesn't change, turn doesn't pass
  };
};
