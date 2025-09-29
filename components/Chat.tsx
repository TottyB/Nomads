import React, { useState, useRef, useEffect } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import type { ChatMessage, User } from '../types';
import { SendIcon, PaperclipIcon, StarIcon } from './Icons';
import Avatar from './Avatar';

const generateId = () => Date.now().toString(36) + Math.random().toString(36).substring(2);

const Chat: React.FC = () => {
  const [user] = useLocalStorage<User | null>('user', null);
  const [messages, setMessages] = useLocalStorage<ChatMessage[]>('teamChatMessages', []);
  const [newMessage, setNewMessage] = useState('');
  const [leaderName] = useState(() => localStorage.getItem('leaderName') || '');
  const [viewingImage, setViewingImage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() && user) {
      const message: ChatMessage = {
        id: generateId(),
        text: newMessage.trim(),
        sender: user.name,
        timestamp: Date.now(),
      };
      setMessages([...messages, message]);
      setNewMessage('');
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800; // Optimize image width
          let { width, height } = img;
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL(file.type, 0.9);

          if (user) {
            const message: ChatMessage = {
              id: generateId(),
              imageUrl: dataUrl,
              sender: user.name,
              timestamp: Date.now(),
            };
            setMessages((prev) => [...prev, message]);
          }
        };
      };
      reader.readAsDataURL(file);
    }
    // Reset file input to allow selecting the same file again
    e.target.value = '';
  };

  return (
    <div className="flex flex-col h-[calc(100vh-9rem)]">
      {/* --- Image Viewer Modal --- */}
      {viewingImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-80 z-[100] flex items-center justify-center p-4 animate-fade-in-down"
          onClick={() => setViewingImage(null)}
        >
          <img src={viewingImage} alt="Full screen view" className="max-w-full max-h-full rounded-lg shadow-2xl" />
        </div>
      )}

      {/* --- Messages Container --- */}
      <div className="flex-grow overflow-y-auto p-4 space-y-4 bg-gray-100 dark:bg-gray-800/50">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-center text-gray-500 dark:text-gray-400">
            <div>
              <p className="font-semibold">No messages yet.</p>
              <p className="text-sm">Be the first to say hello or share a photo!</p>
            </div>
          </div>
        ) : (
          messages.map(msg => {
            const isSentByUser = msg.sender === user?.name;
            const isAnnouncement = msg.sender === leaderName;
            
            return (
              <div key={msg.id} className={`flex items-end gap-3 ${isSentByUser ? 'justify-end' : 'justify-start'}`}>
                {!isSentByUser && <Avatar name={msg.sender} className="w-8 h-8 mb-4"/>}
                <div className={`max-w-xs md:max-w-md p-3 rounded-lg shadow-md ${
                  isSentByUser 
                  ? 'bg-yellow-500 text-white dark:bg-yellow-400 dark:text-gray-900' 
                  : `bg-white dark:bg-gray-700 ${isAnnouncement ? 'border-2 border-yellow-500' : ''}`
                }`}>
                  <div className="flex justify-between items-center mb-1">
                    <p className={`text-sm font-bold ${isAnnouncement ? 'text-yellow-500 dark:text-yellow-400' : ''}`}>{msg.sender}</p>
                    {isAnnouncement && <StarIcon className="w-4 h-4 text-yellow-500" />}
                  </div>
                  
                  {msg.text && <p className="break-words">{msg.text}</p>}
                  
                  {msg.imageUrl && (
                    <button onClick={() => setViewingImage(msg.imageUrl!)}>
                      <img src={msg.imageUrl} alt="Chat attachment" className="rounded-lg max-w-full h-auto cursor-pointer" />
                    </button>
                  )}
                  
                  <p className="text-xs text-right opacity-70 mt-1">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
                {isSentByUser && user && <Avatar name={user.name} src={user.avatar} className="w-8 h-8 mb-4"/>}
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* --- Input Form --- */}
      <form onSubmit={handleSendMessage} className="bg-white dark:bg-gray-800 p-2 border-t border-gray-200 dark:border-gray-700 flex items-center gap-2">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImageSelect}
          className="hidden"
          accept="image/png, image/jpeg"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="p-3 text-gray-500 hover:text-yellow-500 dark:text-gray-400 dark:hover:text-yellow-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
          aria-label="Attach file"
        >
          <PaperclipIcon className="w-6 h-6" />
        </button>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type your message..."
          className="flex-grow bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-full p-3 px-5 focus:outline-none focus:ring-2 focus:ring-yellow-500 dark:focus:ring-yellow-400"
        />
        <button
          type="submit"
          className="bg-yellow-500 dark:bg-yellow-400 text-white dark:text-gray-900 rounded-full p-3 hover:bg-yellow-600 dark:hover:bg-yellow-500 transition-transform transform hover:scale-110 disabled:bg-gray-400 disabled:scale-100"
          aria-label="Send message"
          disabled={!newMessage.trim()}
        >
          <SendIcon className="w-6 h-6" />
        </button>
      </form>
    </div>
  );
};

export default Chat;
