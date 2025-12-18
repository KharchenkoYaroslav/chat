import axios, { AxiosError } from 'axios';
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import styles from '../app.module.scss';
import { io, Socket } from 'socket.io-client';
import { MdEdit } from 'react-icons/md';
import { MdDeleteForever } from 'react-icons/md';
import { FaRegArrowAltCircleDown, FaDownload} from "react-icons/fa";

interface PersonalChatProps {
  userId: string;
  selectedPersonId: string;
  token: string;
}

interface Message {
  id: string;
  sender: string;
  recipient: string;
  content: string;
  createdAt: string;
}

interface ServerException {
  error: string;
  code?: number;
}

const BASE_URL = import.meta.env.VITE_API_URL + '/messenger';

function formatSmartDate(date: Date): string {
  const now = new Date();
  date = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    date.getHours(),
    date.getMinutes(),
    0,
    0
  );

  const isToday =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  const isThisYear = date.getFullYear() === now.getFullYear();

  if (isToday) {
    return date.toLocaleTimeString('uk-UA', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  if (isThisYear) {
    return date.toLocaleString('uk-UA', {
      day: '2-digit',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  return date.toLocaleString('uk-UA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const PersonalChat: React.FC<PersonalChatProps> = ({
  userId,
  selectedPersonId,
  token,
}) => {
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<Map<string, Message>>(new Map());
  const [userLogins, setUserLogins] = useState<Map<string, string>>(new Map());
  const [hasMoreMessages, setHasMoreMessages] = useState<boolean>(true);
  const [messageInput, setMessageInput] = useState<string>('');
  const [isSending, setIsSending] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const MESSAGE_LOAD_LIMIT = 100;

  const sortedMessages = useMemo(() => {
    return [...messages.values()].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  }, [messages]);

  // Отримуємо ID останнього повідомлення в списку
  const lastMessageId = sortedMessages.length > 0
    ? sortedMessages[sortedMessages.length - 1].id
    : null;

  const handleGetLogin = useCallback(
    async (id: string): Promise<string> => {
      const cached = userLogins.get(id);
      if (cached) return cached;

      setError(null);
      try {
        const res = await axios.get<{ login: string }>(
          `${import.meta.env.VITE_API_URL}/auth/login`,
          { params: { userId: id } }
        );
        setUserLogins((prev) => {
          const updated = new Map(prev);
          updated.set(id, res.data.login);
          return updated;
        });
        return res.data.login;
      } catch (err: unknown) {
        if (axios.isAxiosError(err)) {
          const axiosError = err as AxiosError<{ message: string }>;
          if (axiosError.response) {
            setError(
              `Get login failed: ${
                axiosError.response.data?.message ?? 'Bad request'
              } (Status: ${axiosError.response.status})`
            );
          } else if (axiosError.request) {
            setError('Get login failed: No response from server.');
          } else {
            setError('Get login failed: An error occurred.');
          }
        } else if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('Get login failed: Unknown error.');
        }
        return '';
      }
    },
    [userLogins]
  );

  const fetchHistory = useCallback(
    async (lastMessageIdParam?: string): Promise<void> => {
      try {
        const res = await axios.get<{ messages: Message[] }>(
          `${BASE_URL}/get-old-messages`,
          {
            params: {
              participantA: userId,
              participantB: selectedPersonId,
              lastMessageId: lastMessageIdParam,
            },
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        setMessages((prev) => {
          const newMessages = new Map(prev);
          if (res.data.messages && Array.isArray(res.data.messages)) {
            for (const m of res.data.messages) {
              newMessages.set(m.id, m);
            }
          }
          return newMessages;
        });
        setHasMoreMessages(
          (res.data.messages?.length ?? 0) === MESSAGE_LOAD_LIMIT
        );
      } catch (err: unknown) {
        if (err instanceof Error) {
          console.error('Failed to fetch history:', err.message);
        }
      }
    },
    [userId, selectedPersonId, token]
  );

  const sendMessage = useCallback(async () => {
    if (!messageInput.trim() || isSending) return;

    setIsSending(true);
    setError(null);

    try {
      await axios.post(
        `${BASE_URL}/send-message`,
        {
          recipient: selectedPersonId,
          content: messageInput.trim(),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setMessageInput('');
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const axiosError = err as AxiosError<{ message: string }>;
        if (axiosError.response) {
          setError(
            `Send failed: ${
              axiosError.response.data?.message ?? 'Bad request'
            } (Status: ${axiosError.response.status})`
          );
        } else if (axiosError.request) {
          setError('Send failed: No response from server.');
        } else {
          setError('Send failed: An error occurred.');
        }
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Send failed: Unknown error.');
      }
    } finally {
      setIsSending(false);
    }
  }, [messageInput, selectedPersonId, token, isSending]);

  const editMessage = useCallback(
    async (messageId: string, newContent: string) => {
      if (!messageId || !newContent.trim()) return;

      setError(null);
      try {
        await axios.patch(
          `${BASE_URL}/edit-message`,
          {
            messageId,
            newContent: newContent.trim(),
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        setMessages((prev) => {
          const updated = new Map(prev);
          const old = updated.get(messageId);
          if (old) {
            updated.set(messageId, { ...old, content: newContent.trim() });
          }
          return updated;
        });
      } catch (err: unknown) {
        if (axios.isAxiosError(err)) {
          const axiosError = err as AxiosError<{ message: string }>;
          setError(
            `Edit failed: ${
              axiosError.response?.data?.message ?? 'Unknown error'
            }`
          );
        } else if (err instanceof Error) {
          setError(err.message);
        }
      }
    },
    [token]
  );

  const deleteMessage = useCallback(
    async (messageId: string) => {
      if (!messageId) return;

      setError(null);
      try {
        await axios.delete(`${BASE_URL}/delete-message`, {
          data: { messageId },
          headers: { Authorization: `Bearer ${token}` },
        });

        setMessages((prev) => {
          const updated = new Map(prev);
          updated.delete(messageId);
          return updated;
        });
      } catch (err: unknown) {
        if (axios.isAxiosError(err)) {
          const axiosError = err as AxiosError<{ message: string }>;
          setError(
            `Delete failed: ${
              axiosError.response?.data?.message ?? 'Unknown error'
            }`
          );
        } else if (err instanceof Error) {
          setError(err.message);
        }
      }
    },
    [token]
  );

  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  const handleDownloadHistory = async () => {
    setError(null);
    try {
      const response = await axios.get(
        `${BASE_URL}/download-history`,
        {
          params: {
            participantA: userId,
            participantB: selectedPersonId,
          },
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'blob',
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `history_${userId}_${selectedPersonId}.json`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const axiosError = err as AxiosError<{ message: string }>;
        if (axiosError.response) {
          setError(
            `Download failed: ${
              axiosError.response.status
            } (Server error)`
          );
        } else if (axiosError.request) {
          setError('Download failed: No response from server.');
        } else {
          setError('Download failed: An error occurred.');
        }
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Download failed: Unknown error.');
      }
    }
  };

  useEffect(() => {
    const uniqueIds = new Set<string>();
    messages.forEach((m) => {
      uniqueIds.add(m.sender);
      uniqueIds.add(m.recipient);
    });
    uniqueIds.forEach((id) => {
      if (!userLogins.has(id)) {
        void handleGetLogin(id);
      }
    });
  }, [messages, handleGetLogin, userLogins]);

  useEffect(() => {
    if (!userId || !selectedPersonId || !token) return;

    const socket: Socket = io(BASE_URL, { auth: { token } });

    socket.on('connect', () => {
      socket.emit(
        'join-room',
        { participantA: userId, participantB: selectedPersonId },
        () => void fetchHistory()
      );
    });

    socket.on('new-message', (msg: Message) => {
      setMessages((prev) => new Map(prev).set(msg.id, msg));
    });

    socket.on('edit-message', (msg: { id: string; content: string }) => {
      setMessages((prev) => {
        if (prev.has(msg.id)) {
          const old = prev.get(msg.id);
          if (old) {
            return new Map(prev).set(msg.id, { ...old, content: msg.content });
          }
        }
        return prev;
      });
    });

    socket.on('delete-message', (messageId: string) => {
      setMessages((prev) => {
        const newMessages = new Map(prev);
        newMessages.delete(messageId);
        return newMessages;
      });
    });

    socket.on('connect_error', (err: Error) =>
      console.error('Connect error:', err.message)
    );
    socket.on('exception', (err: unknown) => {
      if (typeof err === 'object' && err !== null && 'error' in err) {
        const exception = err as ServerException;
        console.error('Server exception:', exception.error, exception.code);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [userId, selectedPersonId, token, fetchHistory]);

  useEffect(() => {
    setMessages(new Map());
    setHasMoreMessages(true);
  }, [selectedPersonId]);

  // Спрацьовує тільки якщо змінився ID останнього повідомлення (нове повідомлення в кінці)
  useEffect(() => {
    if (lastMessageId) {
      scrollToBottom();
    }
  }, [lastMessageId, scrollToBottom]);


  return (
    <div className={styles.personalChat}>
      {error && <p className={styles.error}>{error}</p>}
      <div className={styles.messagesContainer} ref={messagesContainerRef}>
        {hasMoreMessages && sortedMessages.length > 0 && (
          <button
            className={styles.loadMoreButton}
            onClick={() => {
              const oldestMessage = sortedMessages[0];
              void fetchHistory(oldestMessage?.id);
            }}
          >
            Show more messages
          </button>
        )}

        {sortedMessages.length > 0 && (
          <button className={styles.scrollToBottomButton} onClick={() => scrollToBottom()}>
            <FaRegArrowAltCircleDown/>
          </button>
        )}

        {sortedMessages.length === 0 ? (
          <p className={styles.noMessages}>
            No messages here. Be the first to send a message!
          </p>
        ) : (
          sortedMessages.map((m) => (
            <div
              key={m.id}
              className={`${styles.message} ${
                m.sender === userId ? styles.myMessage : styles.otherMessage
              }`}
            >
              <div className={styles.messageHeader}>
                <span className={styles.messageSender}>
                  {userLogins.get(m.sender) ?? m.sender}
                </span>
                <span className={styles.messageDate}>
                  {' '}
                  [{formatSmartDate(new Date(m.createdAt))}]
                </span>
              </div>
              <span className={styles.messageContent}>{m.content}</span>

              {m.sender === userId && (
                <div className={styles.messageActions}>
                  <button
                    onClick={() => {
                      const newContent = prompt('Edit message:', m.content);
                      if (newContent !== null && newContent.trim() !== '' && m.id) {
                        void editMessage(m.id, newContent);
                      }
                    }}
                  >
                    <MdEdit />
                  </button>
                  <button onClick={() => m.id && void deleteMessage(m.id)}>
                    <MdDeleteForever />
                  </button>
                </div>
              )}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className={styles.messageInputContainer}>
        <input
          type="text"
          value={messageInput}
          onChange={(e) => setMessageInput(e.target.value)}
          placeholder={isSending ? "Sending..." : "Enter message..."}
          disabled={isSending}
          className={styles.messageInput}
          onKeyDown={(e) => {
            if (e.key === 'Enter') void sendMessage();
          }}
        />
        <button
          onClick={() => void sendMessage()}
          className={styles.sendMessageButton}
          disabled={isSending || !messageInput.trim()}
        >
          {isSending ? "..." : "Send"}
        </button>
        <button
            className={styles.downloadButton}
            onClick={handleDownloadHistory}
            title="Download history"
        >
            <FaDownload />
        </button>
      </div>
    </div>
  );
};

export default PersonalChat;
