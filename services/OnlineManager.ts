
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

  public myId: string = '';

  // Initialize Peer
  public async init(): Promise<string> {
    return new Promise((resolve, reject) => {
      // Create a random short ID if possible, but PeerJS usually handles UUIDs
      // Using undefined to let PeerJS Server assign an ID
      const peer = new Peer();

      peer.on('open', (id) => {
        this.myId = id;
        this.peer = peer;
        resolve(id);
      });

      peer.on('connection', (conn) => {
        this.handleConnection(conn);
      });

      peer.on('error', (err) => {
        console.error('Peer error:', err);
        reject(err);
      });
    });
  }

  // Connect to another player
  public connectTo(hostId: string) {
    if (!this.peer) return;
    const conn = this.peer.connect(hostId);
    this.handleConnection(conn);
  }

  private handleConnection(conn: DataConnection) {
    this.conn = conn;

    conn.on('open', () => {
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

  public destroy() {
    if (this.conn) this.conn.close();
    if (this.peer) this.peer.destroy();
    this.peer = null;
    this.conn = null;
  }
}

export const onlineManager = new OnlineManager();
