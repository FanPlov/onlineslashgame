
import Peer, { DataConnection } from 'peerjs';

export type OnlineEvent = 
  | { type: 'MOVE', index: number }
  | { type: 'RESET' }
  | { type: 'PLAYER_DISCONNECT' };

class OnlineManager {
  private peer: Peer | null = null;
  private conn: DataConnection | null = null;
  private onDataCallback: ((data: OnlineEvent) => void) | null = null;
  private onConnectCallback: (() => void) | null = null;
  private onErrorCallback: ((err: string) => void) | null = null;

  public myId: string = '';

  // Generate a short 4-digit ID suffix
  private generateShortId(): string {
    return 'sg-' + Math.floor(1000 + Math.random() * 9000).toString();
  }

  // Initialize Peer with retries for ID generation
  public async init(): Promise<string> {
    this.clean(); // Ensure clean state

    return new Promise((resolve, reject) => {
      const tryInit = (attempt: number) => {
        if (attempt > 5) {
          reject('Could not generate ID');
          return;
        }

        const id = this.generateShortId();
        const peer = new Peer(id, {
            debug: 1
        });

        peer.on('open', (peerId) => {
          this.myId = peerId;
          this.peer = peer;
          console.log("My Peer ID:", peerId);
          resolve(peerId);
        });

        peer.on('connection', (conn) => {
          this.handleConnection(conn);
        });

        peer.on('error', (err: any) => {
          console.warn('Peer error:', err);
          if (err.type === 'unavailable-id') {
            // ID taken, retry
            peer.destroy();
            tryInit(attempt + 1);
          } else if (err.type === 'peer-unavailable') {
             if (this.onErrorCallback) this.onErrorCallback("Game not found. Check the code.");
          } else {
             if (this.onErrorCallback) this.onErrorCallback("Connection error: " + err.type);
          }
        });
      };

      tryInit(0);
    });
  }

  // Connect to another player
  public connectTo(hostId: string) {
    if (!this.peer) return;
    
    // Normalize ID just in case
    const cleanId = hostId.trim().toLowerCase();
    
    // Close existing connection if any
    if (this.conn) {
        this.conn.close();
    }

    console.log("Connecting to:", cleanId);
    const conn = this.peer.connect(cleanId, {
        reliable: true
    });
    
    this.handleConnection(conn);
  }

  private handleConnection(conn: DataConnection) {
    this.conn = conn;

    // Use a timeout to detect if connection hangs
    const timeout = setTimeout(() => {
        if (conn && !conn.open) {
            console.log("Connection timed out");
            if (this.onErrorCallback) this.onErrorCallback("Connection timed out. Try again.");
        }
    }, 5000);

    conn.on('open', () => {
      clearTimeout(timeout);
      console.log('Connected to:', conn.peer);
      if (this.onConnectCallback) this.onConnectCallback();
    });

    conn.on('data', (data: any) => {
      if (this.onDataCallback) {
        this.onDataCallback(data);
      }
    });

    conn.on('close', () => {
      if (this.onDataCallback) this.onDataCallback({ type: 'PLAYER_DISCONNECT' });
      this.conn = null;
    });

    conn.on('error', (err) => {
        console.error("Connection error:", err);
        clearTimeout(timeout);
    });
  }

  public sendMove(index: number) {
    if (this.conn && this.conn.open) {
      this.conn.send({ type: 'MOVE', index });
    }
  }

  public sendReset() {
    if (this.conn && this.conn.open) {
      this.conn.send({ type: 'RESET' });
    }
  }

  public onData(cb: (data: OnlineEvent) => void) {
    this.onDataCallback = cb;
  }

  public onConnect(cb: () => void) {
    this.onConnectCallback = cb;
  }

  public onError(cb: (err: string) => void) {
      this.onErrorCallback = cb;
  }

  public clean() {
    if (this.conn) {
        this.conn.close();
        this.conn = null;
    }
    if (this.peer) {
        this.peer.destroy();
        this.peer = null;
    }
    this.myId = '';
  }

  public destroy() {
    this.clean();
    this.onDataCallback = null;
    this.onConnectCallback = null;
    this.onErrorCallback = null;
  }
}

export const onlineManager = new OnlineManager();
