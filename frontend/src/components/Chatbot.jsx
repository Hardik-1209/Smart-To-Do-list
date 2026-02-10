import React, { useState, useRef, useEffect } from 'react';
import './../index.css'; // Ensure we have access to styles

export default function Chatbot() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { role: 'system', content: 'Hello! I am your AI assistant. How can I help you manage your tasks today?' }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const toggleChat = () => {
        setIsOpen(!isOpen);
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMessage = { role: 'user', content: input };
        setMessages((prev) => [...prev, userMessage]);
        setInput('');
        setLoading(true);

        try {
            const response = await fetch('http://localhost:5000/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message: input }),
            });

            const data = await response.json();

            if (data.error) {
                setMessages((prev) => [...prev, { role: 'system', content: `Error: ${data.error}` }]);
            } else {
                setMessages((prev) => [...prev, { role: 'assistant', content: data.response }]);
            }

        } catch (error) {
            console.error('Chat error:', error);
            setMessages((prev) => [...prev, { role: 'system', content: 'Sorry, I succeeded in making the request but failed to get a response. Please check your network or API key.' }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="chatbot-container">
            {/* Chat Button */}
            {!isOpen && (
                <button className="chatbot-toggle" onClick={toggleChat}>
                    <span className="chatbot-icon">🤖</span>
                </button>
            )}

            {/* Chat Window */}
            {isOpen && (
                <div className="chatbot-window">
                    <div className="chatbot-header">
                        <div className="chatbot-title">
                            <span className="chatbot-icon-small">🤖</span> AI Assistant
                        </div>
                        <button className="chatbot-close" onClick={toggleChat}>×</button>
                    </div>

                    <div className="chatbot-messages">
                        {messages.map((msg, index) => (
                            <div key={index} className={`message message--${msg.role}`}>
                                <div className="message__content">{msg.content}</div>
                            </div>
                        ))}
                        {loading && (
                            <div className="message message--assistant">
                                <div className="message__content typing-indicator">...</div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <form className="chatbot-input-area" onSubmit={handleSend}>
                        <input
                            type="text"
                            className="chatbot-input"
                            placeholder="Ask me anything..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            disabled={loading}
                        />
                        <button type="submit" className="chatbot-send-btn" disabled={loading || !input.trim()}>
                            ➤
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
}
