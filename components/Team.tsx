import React, { useState, useRef, useEffect } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import type { TeamMember, ChatMessage, User } from '../types';
import { PlusIcon, UsersIcon, SendIcon } from './Icons';

const generateId = () => Date.now().toString(36) + Math.random().toString(36).substring(2);

const Team: React.FC = () => {
  const [user] = useLocalStorage<User | null>('user', null);
  const [members, setMembers] = useLocalStorage<TeamMember[]>('teamMembers', []);
  const [contact, setContact] = useState('');
  
  const [messages, setMessages] = useLocalStorage<ChatMessage[]>('teamChatMessages', []);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (contact.trim()) {
      const newMember: TeamMember = {
        id: generateId(),
        contact: contact.trim(),
      };
      setMembers([...members, newMember]);
      setContact('');
    }
  };
  
  const removeMember = (id: string) => {
    setMembers(members.filter(member => member.id !== id));
  }

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

  return (
    <div className="p-4 pb-24">
      <h1 className="text-3xl font-bold text-yellow-500 dark:text-yellow-400 mb-6">Our Crew</h1>

      <form onSubmit={handleAddMember} className="bg-white dark:bg-gray-800 p-4 rounded-lg mb-6 shadow-lg flex items-center gap-4">
        <input
          type="text"
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          placeholder="Add member by email or phone"
          className="flex-grow bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded p-3 focus:outline-none focus:ring-2 focus:ring-yellow-500 dark:focus:ring-yellow-400"
          required
        />
        <button
          type="submit"
          className="bg-yellow-500 dark:bg-yellow-400 text-white dark:text-gray-900 rounded-full p-3 hover:bg-yellow-600 dark:hover:bg-yellow-500 transition-transform transform hover:scale-110"
          aria-label="Add team member"
        >
          <PlusIcon className="w-6 h-6" />
        </button>
      </form>

      <div>
        {members.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400 mt-12">
            <UsersIcon className="w-16 h-16 mx-auto mb-4" />
            <p>Your crew is empty.</p>
            <p>Add your fellow nomads to get started!</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {members.map(member => (
              <li key={member.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md flex justify-between items-center">
                <span className="text-gray-800 dark:text-gray-200">{member.contact}</span>
                <button 
                  onClick={() => removeMember(member.id)} 
                  className="text-red-500 hover:text-red-400 font-bold"
                  aria-label={`Remove ${member.contact}`}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      
      {/* --- Group Chat Section --- */}
      <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
        <h2 className="text-2xl font-bold text-yellow-500 dark:text-yellow-400 mb-4">Group Chat</h2>
        
        <div className="h-96 bg-gray-100 dark:bg-gray-700 rounded-lg p-4 overflow-y-auto flex flex-col gap-4">
          {messages.length === 0 ? (
            <div className="m-auto text-center text-gray-500 dark:text-gray-400">
              <p>No messages yet.</p>
              <p>Be the first to say hello!</p>
            </div>
          ) : (
            messages.map(msg => (
              <div key={msg.id} className={`flex items-end gap-2 ${msg.sender === user?.name ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs md:max-w-md p-3 rounded-lg ${msg.sender === user?.name ? 'bg-yellow-500 text-white dark:bg-yellow-400 dark:text-gray-900' : 'bg-white dark:bg-gray-800'}`}>
                  <p className="text-sm font-bold mb-1">{msg.sender}</p>
                  <p>{msg.text}</p>
                  <p className="text-xs text-right opacity-70 mt-1">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSendMessage} className="mt-4 flex items-center gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-grow bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-full p-3 px-5 focus:outline-none focus:ring-2 focus:ring-yellow-500 dark:focus:ring-yellow-400"
            required
          />
          <button
            type="submit"
            className="bg-yellow-500 dark:bg-yellow-400 text-white dark:text-gray-900 rounded-full p-3 hover:bg-yellow-600 dark:hover:bg-yellow-500 transition-transform transform hover:scale-110 disabled:bg-gray-400"
            aria-label="Send message"
            disabled={!newMessage.trim()}
          >
            <SendIcon className="w-6 h-6" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default Team;
