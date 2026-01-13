'use client';

import { useState, useRef, useEffect } from 'react';
import styles from './page.module.css';

interface Message {
    id: string;
    role: 'user' | 'model';
    content: string;
}

export default function ChatPage() {
    const [userRole, setUserRole] = useState<string>('user');
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 'welcome',
            role: 'model',
            content: '你好！我是新手村村長~\n有什麼關於理財或投資的問題都可以問我喔！\n \n(請注意：我不提供報明牌或即時價位查詢服務)',
        },
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Fetch User Info
        fetch('/api/auth/me')
            .then(res => res.json())
            .then(data => {
                if (data.user) {
                    setUserRole(data.user.role);
                    if (data.user.role === 'admin') {
                        setMessages([{
                            id: 'welcome-admin',
                            role: 'model',
                            content: '你好！我是你的管理小幫手~\n有任何問題都可以問我喔！',
                        }]);
                    }
                }
            })
            .catch(() => { });
    }, []);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: input,
        };

        setMessages((prev) => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    messages: [...messages, userMessage].map(({ role, content }) => ({ role, content }))
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to get response');
            }

            const botMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'model',
                content: data.reply,
            };

            setMessages((prev) => [...prev, botMessage]);
        } catch (error) {
            console.error('Chat error:', error);
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'model',
                content: '抱歉，系統目前遇到了一點問題，請稍後再試。',
            };
            setMessages((prev) => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.chatWindow}>
                <div className={styles.header}>
                    <div>
                        <div className={styles.title}>{userRole === 'admin' ? '管理小幫手' : '村長'}</div>
                    </div>
                </div>

                <div className={styles.messageList}>
                    {messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={`${styles.message} ${msg.role === 'user' ? styles.userMessage : styles.botMessage
                                }`}
                        >
                            <div style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className={styles.typingIndicator}>
                            <div className={styles.dot}></div>
                            <div className={styles.dot}></div>
                            <div className={styles.dot}></div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <form onSubmit={handleSubmit} className={styles.inputArea}>
                    <input
                        type="text"
                        className={styles.input}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={userRole === 'admin' ? '請輸入任何問題...' : '請輸入金融相關問題...'}
                        aria-label="Chat input"
                        disabled={isLoading}
                    />
                    <button
                        type="submit"
                        className={styles.sendBtn}
                        disabled={!input.trim() || isLoading}
                        aria-label="Send message"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            style={{ width: '20px', height: '20px' }}
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
                            />
                        </svg>
                    </button>
                </form>
            </div>
        </div>
    );
}
    