import { useState, useEffect, useRef } from 'react';
import { generateRoomId, generateUniqueRoomCode, getUserBubbleTheme } from './utils/random';
import './App.css';

interface Message {
  id: string;
  text: string;
  sender: 'me' | 'other' | 'system';
  senderId: string;
}

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8080';

export default function App() {
  const [roomInput, setRoomInput] = useState('');
  const [roomError, setRoomError] = useState('');
  const [joinedRoom, setJoinedRoom] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [copied, setCopied] = useState(false);
  const [isServerAlive, setIsServerAlive] = useState(false);

  // Generate a persistent unique ID for this client (e.g. "A8F2")
  const myUserId = useRef<string>(generateUniqueRoomCode(4));
  const socketRef = useRef<WebSocket | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const joinedRoomRef = useRef<string | null>(null);

  // Keep ref in sync so websocket event handlers have latest value
  useEffect(() => {
    joinedRoomRef.current = joinedRoom;
  }, [joinedRoom]);

  // Notify peers when user closes tab or refreshes browser
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN && joinedRoomRef.current) {
        socketRef.current.send(
          JSON.stringify({
            type: 'chat',
            payload: {
              message: JSON.stringify({
                type: 'system',
                text: 'User disconnected',
                senderId: myUserId.current,
              }),
            },
          })
        );
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  // WebSocket connection management with robust socketRef tracking
  useEffect(() => {
    let ws: WebSocket | null = null;
    let timer: number | null = null;
    let isMounted = true;

    const connect = () => {
      try {
        const socket = new WebSocket(WS_URL);
        ws = socket;
        socketRef.current = socket;

        socket.onopen = () => {
          if (!isMounted) return;
          socketRef.current = socket;
          setIsServerAlive(true);
          // Auto-clear stale offline error once connection succeeds
          setRoomError((prev) => (prev.includes('offline') ? '' : prev));

          // If we had an active room, re-join it upon connection/reconnect
          if (joinedRoomRef.current && socket.readyState === WebSocket.OPEN) {
            socket.send(
              JSON.stringify({
                type: 'join',
                payload: { roomCode: joinedRoomRef.current },
              })
            );
          }
        };

        socket.onmessage = (event) => {
          let text = event.data;
          let senderId = '';

          try {
            let parsed = JSON.parse(event.data);

            // Handle potential double-encoded JSON string
            if (typeof parsed === 'string') {
              try {
                parsed = JSON.parse(parsed);
              } catch {}
            }

            if (parsed && typeof parsed === 'object') {
              // System notification (New user joined, User disconnected)
              if (parsed.type === 'system') {
                const systemText = parsed.text || 'Notification';
                setMessages((prev) => [
                  ...prev,
                  {
                    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                    text: systemText,
                    sender: 'system',
                    senderId: 'system',
                  },
                ]);
                return;
              }

              text = parsed.text || event.data;
              if (parsed.senderId) senderId = parsed.senderId;
            }
          } catch {
            text = event.data;
          }

          if (!senderId) {
            senderId = `peer-${Math.random().toString(36).slice(2, 6)}`;
          }

          setMessages((prev) => [
            ...prev,
            {
              id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
              text,
              sender: 'other',
              senderId,
            },
          ]);
        };

        ws.onclose = () => {
          // Only clear socketRef if it still belongs to this closing socket
          if (socketRef.current === ws) {
            socketRef.current = null;
            if (isMounted) setIsServerAlive(false);
          }
          if (isMounted) {
            timer = window.setTimeout(connect, 2000);
          }
        };

        ws.onerror = () => {
          if (socketRef.current === ws) {
            if (isMounted) setIsServerAlive(false);
          }
        };
      } catch {
        if (isMounted) {
          setIsServerAlive(false);
          timer = window.setTimeout(connect, 2000);
        }
      }
    };

    connect();

    return () => {
      isMounted = false;
      if (timer) clearTimeout(timer);
      if (ws) {
        if (socketRef.current === ws) socketRef.current = null;
        ws.close();
      }
    };
  }, []);

  // Auto scroll on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle input change: allow only A-Z and 0-9, max 6 characters
  const handleRoomInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const sanitized = e.target.value.toUpperCase().replace(/[^0-9A-Z]/g, '').slice(0, 6);
    setRoomInput(sanitized);
    setRoomError('');
  };

  // Join a room: verifies backend is open and exactly 6 alphanumeric characters
  const handleJoin = (codeToJoin?: string) => {
    const currentSocket = socketRef.current;

    // Check if socket is in connecting state
    if (currentSocket && currentSocket.readyState === WebSocket.CONNECTING) {
      setRoomError('Connecting to server... please click again in a second');
      return;
    }

    // Check if socket is open
    if (!currentSocket || currentSocket.readyState !== WebSocket.OPEN) {
      setRoomError('Backend server is offline! Please start backend on ws://localhost:8080');
      return;
    }

    const targetCode = (codeToJoin || roomInput).trim().toUpperCase();

    if (targetCode.length !== 6) {
      setRoomError('Room code must be exactly 6 characters');
      return;
    }

    if (!/^[0-9A-Z]{6}$/.test(targetCode)) {
      setRoomError('Only letters (A-Z) and digits (0-9) are allowed');
      return;
    }

    setRoomError('');

    currentSocket.send(
      JSON.stringify({
        type: 'join',
        payload: { roomCode: targetCode },
      })
    );

    // Notify other peers in the room that a new user joined
    currentSocket.send(
      JSON.stringify({
        type: 'chat',
        payload: {
          message: JSON.stringify({
            type: 'system',
            text: 'New user joined',
            senderId: myUserId.current,
          }),
        },
      })
    );

    setJoinedRoom(targetCode);
    setMessages([
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        text: 'New user joined',
        sender: 'system',
        senderId: 'system',
      },
    ]);
  };

  // Create a new room: requires backend to be ALIVE
  const handleCreateRoom = () => {
    if (!isServerAlive || !socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      setRoomError('Backend server is offline! Please start backend on ws://localhost:8080');
      return;
    }

    const newCode = generateRoomId(6);
    setRoomInput(newCode);
    setRoomError('');
    handleJoin(newCode);
  };

  // Leave current room
  const handleLeaveRoom = () => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN && joinedRoom) {
      socketRef.current.send(
        JSON.stringify({
          type: 'chat',
          payload: {
            message: JSON.stringify({
              type: 'system',
              text: 'User disconnected',
              senderId: myUserId.current,
            }),
          },
        })
      );
    }
    setJoinedRoom(null);
    setRoomInput('');
    setRoomError('');
    setMessages([]);
  };

  // Send chat message
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed || !joinedRoom) return;

    const payloadData = {
      text: trimmed,
      senderId: myUserId.current,
    };

    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(
        JSON.stringify({
          type: 'chat',
          payload: { message: JSON.stringify(payloadData) },
        })
      );
    }

    setMessages((prev) => [
      ...prev,
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        text: trimmed,
        sender: 'me',
        senderId: myUserId.current,
      },
    ]);

    setInputText('');
  };

  const copyRoomCode = () => {
    if (!joinedRoom) return;
    navigator.clipboard.writeText(joinedRoom);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <main className="chat-container">
      {/* Header */}
      <header className="chat-header">
        <div className="chat-title-group">
          <svg
            className="chat-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            <line x1="9" y1="9" x2="15" y2="9" />
            <line x1="9" y1="13" x2="13" y2="13" />
          </svg>
          <h1 className="chat-title">Real Time Chat</h1>
        </div>

        {!joinedRoom ? (
          <div className="header-status-badge">
            <span className={`status-dot ${isServerAlive ? 'online' : 'offline'}`} />
            <span className="status-label">{isServerAlive ? 'Server Online' : 'Server Offline'}</span>
          </div>
        ) : (
          <div className="room-badge-group">
            <button
              type="button"
              className="room-badge"
              onClick={copyRoomCode}
              title="Click to copy Room ID"
            >
              <span>Room: {joinedRoom}</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
            </button>
            {copied && <span className="copied-tag">Copied!</span>}
            <button
              type="button"
              className="leave-btn"
              onClick={handleLeaveRoom}
              title="Leave Room"
            >
              Leave
            </button>
          </div>
        )}
      </header>

      {/* View 1: Room Entry / Create Page */}
      {!joinedRoom ? (
        <section className="room-entry-card" aria-label="Join or Create Room">
          <p className="room-intro-text">
            Enter an existing 6-character room code or create a new room to chat.
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleJoin();
            }}
            className="room-form"
          >
            <div className={`room-input-wrapper ${roomError ? 'has-error' : ''}`}>
              <span className="room-input-prefix">#</span>
              <input
                id="room-id"
                type="text"
                maxLength={6}
                className="room-input"
                placeholder="6-DIGIT CODE"
                value={roomInput}
                onChange={handleRoomInputChange}
                autoFocus
              />
              <span className={`char-count ${roomInput.length === 6 ? 'complete' : ''}`}>
                {roomInput.length}/6
              </span>
              {roomInput && (
                <button
                  type="button"
                  className="clear-input-btn"
                  onClick={() => {
                    setRoomInput('');
                    setRoomError('');
                  }}
                  title="Clear input"
                  aria-label="Clear input"
                >
                  ✕
                </button>
              )}
            </div>

            {roomError && <p className="room-error-text">{roomError}</p>}

            <button
              type="submit"
              className="btn btn-primary join-btn"
              disabled={roomInput.length !== 6 || !isServerAlive}
            >
              <span>{isServerAlive ? 'Join Room' : 'Server Offline'}</span>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </button>
          </form>

          <div className="divider">
            <span>OR</span>
          </div>

          <button
            type="button"
            className="create-room-card-btn"
            onClick={handleCreateRoom}
            disabled={!isServerAlive}
          >
            <div className="create-icon-badge">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </div>
            <div className="create-btn-content">
              <span className="create-btn-title">Create New Room</span>
              <span className="create-btn-subtitle">
                {isServerAlive ? 'Generate a random 6-digit ID (0-9, A-Z)' : 'Requires backend to be online'}
              </span>
            </div>
          </button>
        </section>
      ) : (
        /* View 2: Chat View with Middle Box and Input Below */
        <>
          {/* Middle box with messages colored per user */}
          <section className="chat-box" aria-label="Messages">
            {messages.length === 0 ? (
              <div className="empty-state">
                <p>Room connected. Send a message to start!</p>
              </div>
            ) : (
              messages.map((msg) => {
                if (msg.sender === 'system') {
                  return (
                    <div key={msg.id} className="system-message-row">
                      <span className="system-message-pill">{msg.text}</span>
                    </div>
                  );
                }

                const isMe = msg.sender === 'me';
                const theme = getUserBubbleTheme(msg.senderId, isMe);

                return (
                  <div key={msg.id} className={`message ${msg.sender}`}>
                    <div
                      className="message-content"
                      style={{
                        backgroundColor: theme.bg,
                        borderColor: theme.border,
                        color: theme.text,
                      }}
                    >
                      <span className="message-text">{msg.text}</span>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={chatEndRef} />
          </section>

          {/* Just the input below box with send button */}
          <form className="chat-input-row" onSubmit={handleSendMessage}>
            <input
              type="text"
              className="chat-input"
              placeholder="Type a message..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              autoFocus
            />
            <button
              type="submit"
              className="send-btn"
              disabled={!inputText.trim()}
            >
              Send
            </button>
          </form>
        </>
      )}
    </main>
  );
}
