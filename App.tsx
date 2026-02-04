
import React, { useState, useEffect, useRef } from 'react';
import { GameState, GamePhase, Player, GameMode, GameStatus, Language, SymbolType } from './types';
import { isValidMove, executeMove, executeBlockAction, executeRemoveAction } from './logic/gameEngine';
import { translations } from './translations';
import Cell from './components/Cell';
import { onlineManager, OnlineEvent } from './services/OnlineManager';
import { getBotMove } from './services/geminiService';

const DEFAULT_TIME = 30; // Default seconds
const INITIAL_GAME_STATE: GameState = {
  board: Array(9).fill(null),
  currentPlayer: Player.ONE,
  phase: GamePhase.EXPANSION,
  lastMoveIndex: null,
  winner: null,
  p1BlockUsed: false,
  p2BlockUsed: false,
  p1RemoveUsed: false,
  p2RemoveUsed: false,
};

const MUSIC_URL = "https://cdn.pixabay.com/download/audio/2022/11/22/audio_febc508520.mp3?filename=abstract-fashion-pop-131283.mp3";

// Icons
const IconRules = () => <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 19.5A2.5 2.5 0 0 0 6.5 22H20M4 19.5V5A2.5 2.5 0 0 1 6.5 2.5H20v14.5H6.5a2.5 2.5 0 0 0-2.5 2.5z" /></svg>;
const IconMenu = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" /></svg>;
const IconBack = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>;
const IconPause = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const IconPlay = () => <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const IconUndo = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>;
const IconRedo = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" /></svg>;
const IconSettings = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const IconX = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>;
const IconRotate = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>;
const IconClock = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const IconGlobe = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>;
const IconCopy = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>;
const IconBot = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;
const IconTrash = () => <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></svg>;

// Fixed Telegram Icon
const IconTelegram = () => <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" /></svg>;
const IconMail = () => <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>;
const IconCoffee = () => <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8h1a4 4 0 0 1 0 8h-1" /><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" /><line x1="6" y1="1" x2="6" y2="4" /><line x1="10" y1="1" x2="10" y2="4" /><line x1="14" y1="1" x2="14" y2="4" /></svg>;

const App: React.FC = () => {
  const [status, setStatus] = useState<GameStatus>(GameStatus.MENU);
  const [mode, setMode] = useState<GameMode>(GameMode.PVP);
  const [language, setLanguage] = useState<Language>(Language.RU);
  const [history, setHistory] = useState<GameState[]>([INITIAL_GAME_STATE]);
  const [currentStep, setCurrentStep] = useState(0);
  
  // Game Settings State
  const [maxTime, setMaxTime] = useState<number>(DEFAULT_TIME);
  const [timeLeft, setTimeLeft] = useState<number>(DEFAULT_TIME);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isSoundOn, setIsSoundOn] = useState(true);

  // Online State
  const [isOnline, setIsOnline] = useState(false);
  const [showOnlineMenu, setShowOnlineMenu] = useState(false);
  const [myPlayer, setMyPlayer] = useState<Player | null>(null);
  const [joinCode, setJoinCode] = useState('');
  const [hostId, setHostId] = useState<string>('');
  const [isWaitingForOpponent, setIsWaitingForOpponent] = useState(false);

  // Bot State
  const [isBotThinking, setIsBotThinking] = useState(false);

  // UI State
  const [showMenu, setShowMenu] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [rulesTab, setRulesTab] = useState<'CLASSIC' | 'MODE'>('CLASSIC');
  const [showSettings, setShowSettings] = useState(false);
  const [showTimeSettings, setShowTimeSettings] = useState(false);
  const [blockMenuCell, setBlockMenuCell] = useState<number | null>(null);
  const [showPlusOptions, setShowPlusOptions] = useState(false);
  const [showPlayMenu, setShowPlayMenu] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const t = translations[language];
  const gameState = history[currentStep];

  useEffect(() => {
    audioRef.current = new Audio(MUSIC_URL);
    audioRef.current.loop = true;
    audioRef.current.volume = 0.15;

    return () => {
      audioRef.current?.pause();
    };
  }, []);

  useEffect(() => {
    if (audioRef.current) {
        if (status === GameStatus.PLAYING && isSoundOn) {
            audioRef.current.play().catch(() => {});
        } else {
            audioRef.current.pause();
        }
    }
  }, [status, isSoundOn]);

  useEffect(() => {
    let interval: any;
    // TIMER LOGIC: Only run if playing, no winner, NOT ONLINE, and NO MENUS OPEN
    const isPausedByUI = showMenu || showSettings || showRules;
    
    if (status === GameStatus.PLAYING && !gameState.winner && !isOnline && !isPausedByUI) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleTimeOut(gameState.currentPlayer === Player.ONE ? Player.TWO : Player.ONE);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [status, gameState.winner, gameState.currentPlayer, maxTime, isOnline, showMenu, showSettings, showRules]);

  // Online Handlers
  useEffect(() => {
    onlineManager.onConnect(() => {
       setIsWaitingForOpponent(false);
       setStatus(GameStatus.PLAYING);
    });

    onlineManager.onData((data: OnlineEvent) => {
      if (data.type === 'MOVE') {
        executeRemoteMove(data.index);
      } else if (data.type === 'RESET') {
        resetGameLocally();
      } else if (data.type === 'PLAYER_DISCONNECT') {
        alert("Opponent Disconnected");
        setStatus(GameStatus.MENU);
        onlineManager.clean();
      }
    });

    onlineManager.onError((err) => {
        alert(err);
        setIsWaitingForOpponent(false);
    });

    return () => {
       // Cleanup if needed, but keeping connection alive for now
    };
  }, [history, currentStep, status]);

  // BOT LOGIC
  useEffect(() => {
    let ignore = false;
    if (status === GameStatus.PLAYING && mode === GameMode.BOT && gameState.currentPlayer === Player.TWO && !gameState.winner) {
      const playBotTurn = async () => {
        setIsBotThinking(true);
        // Small delay for realism
        await new Promise(r => setTimeout(r, 600));
        
        if (ignore) return;

        try {
          const moveIndex = await getBotMove(gameState);
          if (!ignore && moveIndex !== null) {
            executeBotMoveInGame(moveIndex);
          }
        } catch (e) {
          console.error("Bot failed move", e);
        } finally {
          if (!ignore) setIsBotThinking(false);
        }
      };
      
      playBotTurn();
    }
    return () => { ignore = true; };
  }, [gameState, status, mode]);

  const handleTimeOut = (winner: Player) => {
    updateGameState({ ...gameState, winner, winReason: "Time Out" });
    setStatus(GameStatus.FINISHED);
  };

  const startGame = (selectedMode: GameMode) => {
    setMode(selectedMode);
    setHistory([INITIAL_GAME_STATE]);
    setCurrentStep(0);
    setTimeLeft(maxTime);
    setIsOnline(false);
    setMyPlayer(null);
    setStatus(GameStatus.PLAYING);
    setShowMenu(false);
    setShowPlayMenu(false);
  };

  const startOnlineGame = async (type: 'HOST' | 'JOIN') => {
    setShowPlayMenu(false);
    setShowOnlineMenu(true);
    setMode(GameMode.PVP);
    setIsOnline(true);
    setHostId(''); // Clear previous ID
    
    if (type === 'HOST') {
      try {
        const id = await onlineManager.init();
        setHostId(id);
        setMyPlayer(Player.ONE); // Host is always P1
        setIsWaitingForOpponent(true);
      } catch (e) {
        alert("Failed to connect to online server. Try again later.");
        setShowOnlineMenu(false);
      }
    } else {
      try {
        await onlineManager.init();
        setMyPlayer(Player.TWO); // Joiner is always P2
      } catch (e) {
        alert("Failed to connect to online server.");
        setShowOnlineMenu(false);
      }
    }
  };

  const joinGame = () => {
    if (joinCode) {
      onlineManager.connectTo(joinCode);
      // Wait for onConnect callback to switch status
      // Flip board for P2 so they see themselves at bottom by default
      setIsFlipped(true);
    }
  };

  const handleBackToMenu = () => {
    setStatus(GameStatus.MENU);
    if (isOnline) {
      onlineManager.destroy();
      setIsOnline(false);
      setShowOnlineMenu(false);
      setJoinCode('');
    }
  };

  const resetGameLocally = () => {
    setHistory([INITIAL_GAME_STATE]);
    setCurrentStep(0);
    setTimeLeft(maxTime);
    setStatus(GameStatus.PLAYING);
    setShowMenu(false);
    setBlockMenuCell(null);
  };

  const resetGame = () => {
    resetGameLocally();
    if (isOnline) {
      onlineManager.sendReset();
    }
  };

  const updateGameState = (newState: GameState) => {
    const newHistory = history.slice(0, currentStep + 1);
    newHistory.push(newState);
    setHistory(newHistory);
    setCurrentStep(newHistory.length - 1);
    setTimeLeft(maxTime);
    setBlockMenuCell(null);
    setShowPlusOptions(false);
  };

  const executeRemoteMove = (index: number) => {
    setHistory(prev => {
      const currentState = prev[prev.length - 1];
      if (isValidMove(currentState, index, currentState.currentPlayer)) {
        const newState = executeMove(currentState, index);
        if (newState.winner) setStatus(GameStatus.FINISHED);
        return [...prev, newState];
      }
      return prev;
    });
    setCurrentStep(prev => prev + 1);
    setTimeLeft(maxTime);
  };

  // Helper for Bot to execute move using current state
  const executeBotMoveInGame = (index: number) => {
    if (isValidMove(gameState, index, gameState.currentPlayer)) {
      const newState = executeMove(gameState, index);
      updateGameState(newState);
      if (newState.winner) setStatus(GameStatus.FINISHED);
    }
  };

  const makeMove = (index: number) => {
    if (gameState.winner || status !== GameStatus.PLAYING) return;
    
    // Online Check
    if (isOnline && myPlayer !== gameState.currentPlayer) return;

    // Bot Check: Disable manual move if it is Bot's turn
    if (mode === GameMode.BOT && gameState.currentPlayer === Player.TWO) return;

    if (isValidMove(gameState, index, gameState.currentPlayer)) {
      const newState = executeMove(gameState, index);
      updateGameState(newState);
      
      if (isOnline) {
        onlineManager.sendMove(index);
      }

      if (newState.winner) setStatus(GameStatus.FINISHED);
    }
  };

  const handleBlockAction = () => {
    if (blockMenuCell === null) return;
    if (isOnline) return; 

    const isTargetBlock = gameState.board[blockMenuCell] === SymbolType.BLOCK;
    const action = isTargetBlock ? 'NEUTRALIZE' : 'PLACE';
    const newState = executeBlockAction(gameState, blockMenuCell, action);
    updateGameState(newState);
  };

  const handleRemoveAction = (subOption?: 'KEEP_V' | 'KEEP_H') => {
    if (blockMenuCell === null) return;
    if (isOnline) return;

    const newState = executeRemoveAction(gameState, blockMenuCell, subOption);
    updateGameState(newState);
  };

  const handleUndo = () => {
    if (isOnline) return;
    // Disable Undo during Bot turn to prevent state corruption
    if (mode === GameMode.BOT && gameState.currentPlayer === Player.TWO) return;
    
    if (currentStep === 0 || gameState.winner) return;
    setCurrentStep(prev => prev - 1);
    setTimeLeft(maxTime);
  };

  const handleRedo = () => {
    if (isOnline) return;
    if (currentStep >= history.length - 1 || gameState.winner) return;
    setCurrentStep(prev => prev + 1);
    setTimeLeft(maxTime);
  };

  const isCurrentBlockAvailable = () => gameState.currentPlayer === Player.ONE ? !gameState.p1BlockUsed : !gameState.p2BlockUsed;
  const isCurrentRemoveAvailable = () => gameState.currentPlayer === Player.ONE ? !gameState.p1RemoveUsed : !gameState.p2RemoveUsed;

  const openContextMenu = (idx: number) => {
    if (isOnline) return;
    if (mode === GameMode.BLOCK_MODE && status === GameStatus.PLAYING) {
      setBlockMenuCell(idx);
      setShowPlusOptions(false);
    }
  };

  const toggleFlip = () => {
    setIsFlipped(!isFlipped);
    setShowMenu(false);
  };

  const copyHostId = () => {
    navigator.clipboard.writeText(hostId);
  };

  // Helper to render Player UI (Standard is P2 Top, P1 Bottom)
  const renderPlayerUI = (player: Player) => {
    const isP1 = player === Player.ONE;
    const isCurrent = gameState.currentPlayer === player;
    
    // In Online mode, highlight "ME"
    const isMe = isOnline && myPlayer === player;
    const isBot = mode === GameMode.BOT && player === Player.TWO;

    return (
      <div className={`w-full max-w-md flex items-center justify-between px-4 transition-all duration-300 ${isCurrent ? 'opacity-100 scale-105' : 'opacity-30 scale-95'}`}>
         <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg transition-all ${isCurrent ? (isP1 ? 'bg-cyan-500 text-slate-950 shadow-xl shadow-cyan-500/30' : 'bg-rose-500 text-white shadow-xl shadow-rose-500/30') : 'glass text-slate-500'}`}>
              {isP1 ? 'P1' : (isBot ? <span className="animate-pulse">AI</span> : 'P2')}
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">
                {isP1 ? t.player1 : (isBot ? 'Gemini AI' : t.player2)} {isMe && "(YOU)"}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-lg font-mono font-black text-white">
                    {/* Hide Timer in Online Mode */}
                    {isOnline ? '∞' : (isCurrent ? (isBot && isBotThinking ? <span className="animate-pulse text-xs tracking-widest">THINKING...</span> : `0:${timeLeft.toString().padStart(2, '0')}`) : `--:--`)}
                </span>
                {mode === GameMode.BLOCK_MODE && (
                  <div className="flex gap-1">
                    <div className={`w-2.5 h-2.5 rounded-full ${isP1 ? gameState.p1BlockUsed ? 'bg-slate-700' : 'bg-amber-500 shadow-[0_0_5px_rgba(245,158,11,1)]' : gameState.p2BlockUsed ? 'bg-slate-700' : 'bg-amber-500 shadow-[0_0_5px_rgba(245,158,11,1)]'}`} title="Block" />
                    <div className={`w-2.5 h-2.5 rounded-sm ${isP1 ? gameState.p1RemoveUsed ? 'bg-slate-700' : 'bg-rose-500 shadow-[0_0_5px_rgba(244,63,94,1)]' : gameState.p2RemoveUsed ? 'bg-slate-700' : 'bg-rose-500 shadow-[0_0_5px_rgba(244,63,94,1)]'}`} title="Remove" />
                  </div>
                )}
              </div>
            </div>
         </div>
         {/* Phase Indicator */}
         {!isP1 && (
           <div className={`px-3 py-1 rounded-full border border-white/10 glass text-[8px] font-black uppercase tracking-[0.2em] ${gameState.phase === GamePhase.EXPANSION ? 'text-cyan-400' : 'text-amber-500'}`}>
              {gameState.phase === GamePhase.EXPANSION ? t.expansion : t.battle}
           </div>
         )}
      </div>
    );
  };

  return (
    <div className="min-h-screen h-[100dvh] flex flex-col overflow-hidden text-slate-100 bg-slate-950 font-sans selection:bg-indigo-500/30">
      
      {status === GameStatus.MENU ? (
        <div className="flex-1 flex flex-col items-center p-6 w-full h-full animate-in fade-in duration-500 relative">
          
          {/* Main Content Area - Centered */}
          <div className="flex-1 flex flex-col items-center justify-center gap-12 w-full max-w-xs z-10">
              <div className="text-center space-y-3">
                <h1 className="text-4xl sm:text-6xl font-black orbitron tracking-tighter whitespace-nowrap text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] border-y-2 border-white/10 py-4">
                  SLASH // GAME
                </h1>
                <p className="text-slate-500 tracking-[0.3em] text-[10px] uppercase font-bold">Abstract Intelligence System</p>
              </div>
              
              <div className="flex flex-col gap-4 w-full relative">
                {!showPlayMenu && !showOnlineMenu ? (
                  <>
                    <button onClick={() => { setShowPlayMenu(true); }} className="group relative w-full py-5 bg-white text-slate-950 font-black rounded-3xl overflow-hidden active:scale-95 transition-all shadow-[0_0_30px_rgba(255,255,255,0.1)]">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                      <span className="relative text-lg tracking-widest uppercase flex items-center justify-center gap-3"><IconPlay /> PLAY</span>
                    </button>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <button onClick={() => { setShowRules(true); }} className="py-4 glass rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] active:scale-95 transition-transform hover:bg-white/10 flex items-center justify-center gap-2 shadow-lg"><IconRules /> {t.rules}</button>
                      <button onClick={() => { setShowSettings(true); }} className="py-4 glass rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] active:scale-95 transition-transform hover:bg-white/10 flex items-center justify-center gap-2 shadow-lg"><IconSettings /> {t.settings}</button>
                    </div>
                  </>
                ) : showOnlineMenu ? (
                  <div className="flex flex-col gap-3 animate-in zoom-in-95 duration-200">
                    {!hostId && myPlayer !== Player.TWO ? (
                      <>
                        <button onClick={() => startOnlineGame('HOST')} className="w-full py-4 bg-indigo-600 text-white font-black rounded-2xl text-xs uppercase tracking-widest active:scale-95 transition-transform shadow-lg">
                          Create Game (Host)
                        </button>
                        <div className="glass p-4 rounded-2xl space-y-3">
                            <input 
                              type="text" 
                              placeholder="Enter Friend's Code" 
                              value={joinCode}
                              onChange={(e) => setJoinCode(e.target.value.replace(/\s/g, ''))} 
                              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-xs text-center font-mono outline-none focus:border-indigo-500 transition-colors"
                            />
                            <button onClick={joinGame} className="w-full py-3 bg-white text-slate-900 font-black rounded-xl text-xs uppercase tracking-widest active:scale-95">
                              Join Game
                            </button>
                        </div>
                      </>
                    ) : (
                      <div className="glass p-6 rounded-2xl space-y-4 text-center">
                        {isWaitingForOpponent ? (
                          <>
                            <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Waiting for Opponent...</div>
                            <div className="animate-pulse w-3 h-3 bg-indigo-500 rounded-full mx-auto" />
                            <div className="bg-slate-900 p-4 rounded-xl border border-slate-700 flex items-center justify-between gap-2">
                              <span className="font-mono text-xs truncate select-all">{hostId}</span>
                              <button onClick={copyHostId} className="text-slate-400 hover:text-white"><IconCopy /></button>
                            </div>
                            <div className="text-[9px] text-slate-500">Send this code to your friend</div>
                          </>
                        ) : (
                          <div className="text-green-400 font-bold uppercase tracking-widest">Connected!</div>
                        )}
                      </div>
                    )}
                    <button onClick={() => { setShowOnlineMenu(false); onlineManager.destroy(); setHostId(''); setMyPlayer(null); }} className="mt-2 py-3 text-slate-500 font-bold text-[10px] uppercase tracking-widest hover:text-white">
                      Back
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3 animate-in zoom-in-95 duration-200">
                    <button onClick={() => startGame(GameMode.PVP)} className="w-full py-4 bg-white text-slate-900 font-black rounded-2xl text-xs uppercase tracking-widest active:scale-95 transition-transform shadow-lg">
                      {t.playPvp}
                    </button>
                    <button onClick={() => startGame(GameMode.BOT)} className="w-full py-4 bg-emerald-900 border border-emerald-500/30 text-emerald-300 font-black rounded-2xl text-xs uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 hover:bg-emerald-800 transition-colors shadow-lg">
                       {t.playBot} <IconBot />
                    </button>
                    <button onClick={() => startGame(GameMode.BLOCK_MODE)} className="w-full py-4 bg-slate-800 border border-amber-500/50 text-amber-500 font-black rounded-2xl text-xs uppercase tracking-widest active:scale-95 transition-transform shadow-lg">
                      {t.playSlashMode}
                    </button>
                    <button onClick={() => { setShowOnlineMenu(true); }} className="w-full py-4 bg-indigo-900 border border-indigo-500/30 text-indigo-300 font-black rounded-2xl text-xs uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 hover:bg-indigo-800 transition-colors">
                      Online <IconGlobe />
                    </button>
                    <button onClick={() => { setShowPlayMenu(false); }} className="mt-2 py-3 text-slate-500 font-bold text-[10px] uppercase tracking-widest hover:text-white">
                      Back
                    </button>
                  </div>
                )}
              </div>
          </div>
          
          <div className="flex gap-4 mt-auto pb-12 z-10">
             <a href="#" className="w-12 h-12 bg-slate-900 border border-white/10 rounded-2xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shadow-lg active:scale-95"><IconTelegram /></a>
             <a href="#" className="w-12 h-12 bg-slate-900 border border-white/10 rounded-2xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shadow-lg active:scale-95"><IconMail /></a>
             <a href="#" className="w-12 h-12 bg-slate-900 border border-white/10 rounded-2xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shadow-lg active:scale-95"><IconCoffee /></a>
          </div>

          <div className="absolute bottom-4 left-0 right-0 text-center z-0">
             <p className="text-[10px] font-medium text-slate-700 tracking-wide">{t.copyright}</p>
          </div>
        </div>
      ) : (
        <>
          <header className="h-14 flex items-center justify-between px-5 glass border-b border-white/5 z-40 relative">
            <button onClick={handleBackToMenu} className="p-2 -ml-2 text-slate-400 hover:text-white transition-colors active:scale-90"><IconBack /></button>
            <div className="flex flex-col items-center">
              <h2 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] orbitron whitespace-nowrap">
                {isOnline ? 'ONLINE PVP' : (mode === GameMode.BOT ? 'PLAYER VS AI' : t.gameTitle)}
              </h2>
              <div className={`h-0.5 w-6 rounded-full shadow-[0_0_8px_rgba(99,102,241,0.5)] ${isOnline ? 'bg-green-500' : (mode === GameMode.BOT ? 'bg-emerald-500' : 'bg-indigo-500')}`} />
            </div>
            <button onClick={() => { setShowSettings(true); }} className="p-2 -mr-2 text-slate-400 hover:text-white transition-colors active:scale-90"><IconSettings /></button>
          </header>
          
          <main className="flex-1 flex flex-col items-center justify-between py-6 px-4 gap-2 overflow-hidden relative z-0">
            {/* Top Player Info */}
            {isFlipped ? renderPlayerUI(Player.ONE) : renderPlayerUI(Player.TWO)}
            
            <div className="relative p-2.5 glass rounded-[1.5rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,1)] border-white/10">
              <div className="grid grid-cols-3 gap-2 p-1.5 rounded-2xl bg-black/50 w-[82vw] h-[82vw] max-w-[300px] max-h-[300px]">
                {gameState.board.map((symbol, idx) => (
                  <Cell 
                    key={idx} 
                    symbol={symbol} 
                    isValid={isValidMove(gameState, idx, gameState.currentPlayer)} 
                    isLastMove={gameState.lastMoveIndex === idx} 
                    isLocked={gameState.lastMoveIndex === idx} 
                    disabled={status !== GameStatus.PLAYING || (isOnline && gameState.currentPlayer !== myPlayer) || (mode === GameMode.BOT && gameState.currentPlayer === Player.TWO)} 
                    onClick={() => makeMove(idx)} 
                    onLongPress={() => openContextMenu(idx)}
                  />
                ))}
              </div>
              
              {isOnline && isWaitingForOpponent && (
                 <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/80 rounded-[1.5rem] animate-in fade-in">
                    <div className="text-center p-6">
                       <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4" />
                       <div className="text-[10px] font-black uppercase text-white tracking-widest">Waiting for P2...</div>
                    </div>
                 </div>
              )}

              {blockMenuCell !== null && !isOnline && (
                <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/50 rounded-[1.5rem] animate-in fade-in duration-200">
                  <div className="bg-slate-900 border border-slate-700 p-4 rounded-2xl shadow-2xl flex flex-col gap-2 w-[85%] max-w-[220px]">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center mb-1">Actions</h4>
                    
                    {gameState.board[blockMenuCell] === SymbolType.BLOCK ? (
                      <button onClick={handleBlockAction} disabled={!isCurrentBlockAvailable()} className={`py-3 font-black rounded-xl text-[9px] uppercase tracking-widest active:scale-95 transition-transform ${isCurrentBlockAvailable() ? 'bg-amber-500 text-slate-900' : 'bg-slate-800 text-slate-500'}`}>
                        Neutralize Block
                      </button>
                    ) : (
                      <button onClick={handleBlockAction} disabled={!isCurrentBlockAvailable()} className={`py-3 font-black rounded-xl text-[9px] uppercase tracking-widest active:scale-95 transition-transform ${isCurrentBlockAvailable() ? 'bg-amber-500 text-slate-900' : 'bg-slate-800 text-slate-500'}`}>
                        Place Block
                      </button>
                    )}

                    {gameState.board[blockMenuCell] !== null && gameState.board[blockMenuCell] !== SymbolType.BLOCK && (
                      <>
                        {showPlusOptions ? (
                          <div className="grid grid-cols-2 gap-2">
                             <button onClick={() => handleRemoveAction('KEEP_H')} className="py-2 bg-rose-500 text-white font-bold rounded-lg text-[8px] uppercase">Remove (|)</button>
                             <button onClick={() => handleRemoveAction('KEEP_V')} className="py-2 bg-rose-500 text-white font-bold rounded-lg text-[8px] uppercase">Remove (—)</button>
                          </div>
                        ) : (
                          <button 
                            onClick={() => {
                              if (gameState.board[blockMenuCell] === SymbolType.PLUS) {
                                setShowPlusOptions(true);
                              } else {
                                handleRemoveAction();
                              }
                            }} 
                            disabled={!isCurrentRemoveAvailable()} 
                            className={`py-3 font-black rounded-xl text-[9px] uppercase tracking-widest active:scale-95 transition-transform flex items-center justify-center gap-2 ${isCurrentRemoveAvailable() ? 'bg-rose-500 text-white' : 'bg-slate-800 text-slate-500'}`}
                          >
                             <IconTrash /> Remove
                          </button>
                        )}
                      </>
                    )}

                    <button onClick={() => { setBlockMenuCell(null); }} className="py-3 text-slate-500 font-bold text-[8px] uppercase tracking-widest active:scale-95 transition-transform hover:text-slate-300">Cancel</button>
                  </div>
                </div>
              )}

              {gameState.winner && (
                <div className="absolute inset-0 z-[60] flex items-center justify-center bg-slate-950/95 rounded-[1.5rem] border border-white/10">
                   <div className="text-center p-6 space-y-4">
                      <div className="text-5xl">🏆</div>
                      <div className="space-y-1">
                        <h3 className="text-2xl font-black text-white uppercase tracking-tighter">{gameState.winner === 'DRAW' ? t.draw : t.winner}</h3>
                        <p className="text-slate-500 text-[8px] font-black uppercase tracking-[0.2em]">{gameState.winner !== 'DRAW' ? `P${gameState.winner} Dominates` : 'Equilibrium'}</p>
                      </div>
                      <button onClick={resetGame} className="w-full py-3 bg-white text-slate-900 font-black rounded-xl transition-all uppercase text-[10px] tracking-widest shadow-xl">NEW GAME</button>
                   </div>
                </div>
              )}
            </div>

            {isFlipped ? renderPlayerUI(Player.TWO) : renderPlayerUI(Player.ONE)}

          </main>

          <footer className="glass border-t border-white/10 px-6 pt-5 pb-10 z-[60] shadow-[0_-10px_30px_rgba(0,0,0,0.5)] w-full">
            <div className="flex items-center justify-between max-w-md mx-auto">
              <button 
                onClick={() => { setShowMenu(true); }} 
                className="flex flex-col items-center gap-1 group active:scale-95 transition-transform p-2 cursor-pointer touch-manipulation"
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                <div className="p-2.5 rounded-xl text-slate-400 group-hover:text-white bg-white/5 pointer-events-none"><IconMenu /></div>
                <span className="text-[8px] font-black uppercase tracking-widest opacity-60 pointer-events-none">{t.menu}</span>
              </button>
              
              <div className="flex gap-3">
                <button 
                  onClick={handleUndo} 
                  disabled={isOnline || currentStep === 0 || (mode === GameMode.BOT && gameState.currentPlayer === Player.TWO)} 
                  className={`p-4 rounded-xl transition-all shadow-lg active:scale-95 ${isOnline || currentStep === 0 || (mode === GameMode.BOT && gameState.currentPlayer === Player.TWO) ? 'opacity-20' : 'glass hover:bg-white/10 border-white/20'}`}
                >
                  <IconUndo />
                </button>
                <button 
                  onClick={handleRedo} 
                  disabled={isOnline || currentStep >= history.length - 1} 
                  className={`p-4 rounded-xl transition-all shadow-lg active:scale-95 ${isOnline || currentStep >= history.length - 1 ? 'opacity-20' : 'glass hover:bg-white/10 border-white/20'}`}
                >
                  <IconRedo />
                </button>
              </div>
              
              <button 
                onClick={() => { setStatus(GameStatus.PAUSED); }} 
                className="flex flex-col items-center gap-1 group active:scale-95 transition-transform p-2 cursor-pointer touch-manipulation"
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                <div className="p-2.5 rounded-xl text-slate-400 group-hover:text-white bg-white/5 pointer-events-none"><IconPause /></div>
                <span className="text-[8px] font-black uppercase tracking-widest opacity-60 pointer-events-none">{t.paused}</span>
              </button>
            </div>
          </footer>
        </>
      )}

      {showMenu && (
        <div className="fixed inset-0 z-[250] bg-slate-950/98 flex items-center justify-center p-8 backdrop-blur-sm">
           <div className="bg-slate-900 border border-slate-700 w-full max-w-xs rounded-2xl p-6 shadow-2xl space-y-3">
              <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-6 text-center">{t.menu}</h3>
              
              {!showTimeSettings ? (
                <>
                  <button onClick={() => { setShowMenu(false); }} className="w-full py-4 bg-white text-slate-950 font-black rounded-xl transition-all uppercase tracking-widest text-[11px] shadow-lg active:scale-95">{t.resume}</button>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={toggleFlip} className="py-4 bg-slate-800 text-white font-bold rounded-xl transition-all uppercase tracking-widest text-[10px] shadow-lg active:scale-95 flex flex-col items-center justify-center gap-2">
                      <IconRotate /> Flip Board
                    </button>
                    <button onClick={() => { setShowTimeSettings(true); }} className="py-4 bg-slate-800 text-white font-bold rounded-xl transition-all uppercase tracking-widest text-[10px] shadow-lg active:scale-95 flex flex-col items-center justify-center gap-2">
                      <IconClock /> Time Set
                    </button>
                  </div>
                  <button onClick={resetGame} className="w-full py-4 bg-rose-900/50 text-rose-200 border border-rose-500/20 font-black rounded-xl transition-all uppercase tracking-widest text-[11px] shadow-lg active:scale-95">{t.reset}</button>
                </>
              ) : (
                <div className="space-y-4 animate-in slide-in-from-right duration-200">
                  <div className="text-center space-y-2">
                     <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Move Duration</span>
                     <div className="text-4xl font-black text-indigo-400 font-mono">{maxTime < 60 ? `${maxTime}s` : `${maxTime/60}m`}</div>
                  </div>
                  <div className="px-2">
                    <input 
                      type="range" 
                      min="0" 
                      max="3" 
                      step="1" 
                      value={[15, 30, 60, 120].indexOf(maxTime)} 
                      onChange={(e) => setMaxTime([15, 30, 60, 120][parseInt(e.target.value)])}
                      className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />
                    <div className="flex justify-between text-[8px] font-black text-slate-500 mt-2 uppercase tracking-widest">
                      <span>15s</span>
                      <span>30s</span>
                      <span>1m</span>
                      <span>2m</span>
                    </div>
                  </div>
                  <button onClick={() => { setShowTimeSettings(false); }} className="w-full py-3 bg-indigo-600 text-white font-black rounded-xl uppercase tracking-widest text-[10px] mt-4">Save</button>
                </div>
              )}
           </div>
        </div>
      )}

      {showSettings && (
        <div className="fixed inset-0 z-[210] bg-slate-950/98 flex items-center justify-center p-6 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-xs rounded-2xl p-6 relative shadow-2xl">
            <button onClick={() => { setShowSettings(false); }} className="absolute top-5 right-5 text-slate-500 hover:text-white transition-colors"><IconX /></button>
            <h3 className="text-xl font-black text-white mb-8 uppercase tracking-tighter">{t.settings}</h3>
            <div className="space-y-8">
              <div>
                <span className="text-slate-500 text-[8px] font-black uppercase tracking-widest block mb-3">{t.lang}</span>
                <div className="grid grid-cols-3 gap-2">
                  {[Language.RU, Language.EN, Language.UZ].map(l => (
                    <button key={l} onClick={() => { setLanguage(l); }} className={`py-3 text-[10px] font-black rounded-lg transition-all ${language === l ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/30' : 'bg-slate-800 text-slate-500 hover:bg-slate-700'}`}>{l}</button>
                  ))}
                </div>
              </div>
              
              <div>
                <span className="text-slate-500 text-[8px] font-black uppercase tracking-widest block mb-3">{t.sound}</span>
                <div className="grid grid-cols-2 gap-2">
                   <button onClick={() => { setIsSoundOn(true); }} className={`py-3 text-[10px] font-black rounded-lg transition-all ${isSoundOn ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/30' : 'bg-slate-800 text-slate-500 hover:bg-slate-700'}`}>{t.on}</button>
                   <button onClick={() => { setIsSoundOn(false); }} className={`py-3 text-[10px] font-black rounded-lg transition-all ${!isSoundOn ? 'bg-slate-600 text-white' : 'bg-slate-800 text-slate-500 hover:bg-slate-700'}`}>{t.off}</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showRules && (
        <div className="fixed inset-0 z-[300] bg-slate-950/98 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-3xl relative shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
            <div className="flex-none p-6 border-b border-white/5 bg-slate-900 z-10 sticky top-0">
               <div className="flex items-center justify-between mb-6">
                 <h3 className="text-2xl font-black text-white uppercase tracking-tighter">{t.rulesTitle}</h3>
                 <button onClick={() => { setShowRules(false); }} className="p-2 bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors active:scale-90"><IconX /></button>
               </div>
               <div className="grid grid-cols-2 bg-slate-800 p-1 rounded-xl">
                 <button 
                   onClick={() => { setRulesTab('CLASSIC'); }} 
                   className={`py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${rulesTab === 'CLASSIC' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-500 hover:text-slate-300'}`}
                 >
                   {t.tabClassic}
                 </button>
                 <button 
                   onClick={() => { setRulesTab('MODE'); }} 
                   className={`py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${rulesTab === 'MODE' ? 'bg-amber-500 text-slate-900 shadow-md' : 'text-slate-500 hover:text-slate-300'}`}
                 >
                   {t.tabMode}
                 </button>
               </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 text-[11px] leading-relaxed text-slate-300">
              {rulesTab === 'CLASSIC' ? (
                 <>
                   <div className="space-y-2 bg-black/20 p-4 rounded-xl border border-white/5">
                      <p className="font-black text-cyan-400 uppercase tracking-widest text-[9px]">01 // {t.expansion}</p>
                      <p>{t.classicRules1}</p>
                   </div>
                   <div className="space-y-2 bg-black/20 p-4 rounded-xl border border-white/5">
                      <p className="font-black text-rose-500 uppercase tracking-widest text-[9px]">02 // {t.battle}</p>
                      <p>{t.classicRules2}</p>
                   </div>
                   <div className="space-y-2 bg-black/20 p-4 rounded-xl border border-white/5">
                      <p className="font-black text-indigo-400 uppercase tracking-widest text-[9px]">03 // KO</p>
                      <p>{t.classicRules3}</p>
                   </div>
                   <p className="text-center font-black text-white p-2 border border-green-500/20 bg-green-900/10 rounded-lg">{t.classicWin}</p>
                 </>
              ) : (
                 <>
                   <div className="p-4 bg-amber-900/10 border border-amber-500/20 rounded-xl mb-4">
                     <p className="text-amber-400 font-bold mb-2">{t.slashRulesIntro}</p>
                   </div>
                   <div className="space-y-4">
                      <div className="flex gap-4 items-start">
                         <div className="w-8 h-8 rounded-full bg-amber-500 flex-shrink-0 flex items-center justify-center font-black text-slate-900">O</div>
                         <p>{t.slashAction1}</p>
                      </div>
                      <div className="flex gap-4 items-start">
                         <div className="w-8 h-8 rounded-full bg-rose-500 flex-shrink-0 flex items-center justify-center text-white"><IconTrash /></div>
                         <p>{t.slashAction2}</p>
                      </div>
                      <div className="flex gap-4 items-start">
                         <div className="w-8 h-8 rounded-full bg-indigo-500 flex-shrink-0 flex items-center justify-center text-white font-black">N</div>
                         <p>{t.slashAction3}</p>
                      </div>
                   </div>
                 </>
              )}
            </div>
          </div>
        </div>
      )}

      {status === GameStatus.PAUSED && (
        <div className="fixed inset-0 z-[300] bg-slate-950/98 flex flex-col items-center justify-center px-6 backdrop-blur-sm">
           <h2 className="text-5xl font-black text-white uppercase tracking-tighter orbitron italic mb-12">{t.paused}</h2>
           <button onClick={() => { setStatus(GameStatus.PLAYING); }} className="group relative px-10 py-5 bg-white text-slate-950 font-black rounded-2xl flex items-center gap-4 transition-all active:scale-95 shadow-[0_20px_50px_rgba(255,255,255,0.1)]">
             <IconPlay /> <span className="text-lg tracking-widest uppercase">{t.resume}</span>
           </button>
        </div>
      )}
    </div>
  );
};

export default App;
