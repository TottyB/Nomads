import React, { useState, useRef, useEffect } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import type { ChatMessage, Profile } from '../types';
import { SendIcon, PaperclipIcon, StarIcon } from './Icons';
import Avatar from './Avatar';
import { useAuth } from '../contexts/AuthContext';

const Chat: React.FC = () => {
  const { supabase, profile, isOnline } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [cachedMessages, setCachedMessages] = useLocalStorage<ChatMessage[]>('chatCache', []);

  const [newMessage, setNewMessage] = useState('');
  const [viewingImage, setViewingImage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    setMessages(cachedMessages);
    
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('chat_messages')
        .select(`
          *,
          profiles ( name, avatar_url, role )
        `)
        .order('timestamp', { ascending: true });
        
      if (error) {
        console.error("Error fetching messages", error);
      } else {
        setMessages(data as any);
        setCachedMessages(data as any);
      }
    };
    fetchMessages();

    const channel = supabase.channel('realtime:chat');
    channel.on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, 
    (payload) => {
      // This is a simple refetch. For a better UX, you could just append the new message.
      fetchMessages();
    }).subscribe();

    return () => {
      supabase.removeChannel(channel);
    }
  }, [supabase, setCachedMessages]);

  const handleSendMessage = async (e: React.FormEvent, imageUrl: string | null = null) => {
    e.preventDefault();
    if ((!newMessage.trim() && !imageUrl) || !profile) return;
    
    const messageContent = {
      user_id: profile.id,
      text: newMessage.trim() || undefined,
      imageUrl: imageUrl || undefined,
    };

    const { error } = await supabase.from('chat_messages').insert(messageContent);
    
    if (error) {
      alert("Could not send message: " + error.message);
    } else {
      setNewMessage('');
    }
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!profile || !e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];

    const fileExt = file.name.split('.').pop();
    const fileName = `${profile.id}-${Date.now()}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage.from('chat-images').upload(fileName, file);
    if(uploadError) {
      alert("Error uploading image: " + uploadError.message);
      return;
    }

    const { data: { publicUrl } } = supabase.storage.from('chat-images').getPublicUrl(fileName);
    handleSendMessage(e, publicUrl);

    if(fileInputRef.current) fileInputRef.current.value = "";
  };
  
  return (
    <div className="flex flex-col h-[calc(100vh-9rem)]">
      {viewingImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-80 z-[100] flex items-center justify-center p-4 animate-fade-in-down"
          onClick={() => setViewingImage(null)}
        >
          <img src={viewingImage} alt="Full screen view" className="max-w-full max-h-full rounded-lg shadow-2xl" />
        </div>
      )}

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
            const isSentByUser = msg.user_id === profile?.id;
            const senderProfile = msg.profiles as Profile | undefined;
            const isAnnouncement = senderProfile?.role === 'leader';
            const senderName = senderProfile?.name || 'Unknown';

            return (
              <div key={msg.id} className={`flex items-end gap-3 ${isSentByUser ? 'justify-end' : 'justify-start'}`}>
                {!isSentByUser && <Avatar name={senderName} src={senderProfile?.avatar_url} className="w-8 h-8 mb-4"/>}
                <div className={`max-w-xs md:max-w-md p-3 rounded-lg shadow-md ${
                  isSentByUser 
                  ? 'bg-yellow-500 text-white dark:bg-yellow-400 dark:text-gray-900' 
                  : `bg-white dark:bg-gray-700 ${isAnnouncement ? 'border-2 border-yellow-500' : ''}`
                }`}>
                  <div className="flex justify-between items-center mb-1">
                    <p className={`text-sm font-bold ${isAnnouncement ? 'text-yellow-500 dark:text-yellow-400' : ''}`}>{senderName}</p>
                    {isAnnouncement && <StarIcon className="w-4 h-4 text-yellow-500" />}
                  </div>
                  
                  {msg.text && <p className="break-words">{msg.text}</p>}
                  
                  {msg.imageUrl && (
                    <button onClick={() => setViewingImage(msg.imageUrl!)}>
                      <img src={msg.imageUrl} alt="Chat attachment" className="rounded-lg max-w-full h-auto cursor-pointer mt-2" />
                    </button>
                  )}
                  
                  <p className="text-xs text-right opacity-70 mt-1">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
                {isSentByUser && profile && <Avatar name={profile.name} src={profile.avatar_url} className="w-8 h-8 mb-4"/>}
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className="bg-white dark:bg-gray-800 p-2 border-t border-gray-200 dark:border-gray-700 flex items-center gap-2">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImageSelect}
          className="hidden"
          accept="image/png, image/jpeg"
          disabled={!isOnline}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="p-3 text-gray-500 hover:text-yellow-500 dark:text-gray-400 dark:hover:text-yellow-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
          aria-label="Attach file"
          disabled={!isOnline}
        >
          <PaperclipIcon className="w-6 h-6" />
        </button>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder={isOnline ? "Type your message..." : "Offline - cannot send messages"}
          className="flex-grow bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-full p-3 px-5 focus:outline-none focus:ring-2 focus:ring-yellow-500 dark:focus:ring-yellow-400"
          disabled={!isOnline}
        />
        <button
          type="submit"
          className="bg-yellow-500 dark:bg-yellow-400 text-white dark:text-gray-900 rounded-full p-3 hover:bg-yellow-600 dark:hover:bg-yellow-500 transition-transform transform hover:scale-110 disabled:bg-gray-400 disabled:scale-100 disabled:cursor-not-allowed"
          aria-label="Send message"
          disabled={(!newMessage.trim() && !fileInputRef.current?.files?.length) || !isOnline}
        >
          <SendIcon className="w-6 h-6" />
        </button>
      </form>
    </div>
  );
};

export default Chat;