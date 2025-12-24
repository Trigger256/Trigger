
import React, { useState, useEffect, useRef } from 'react';
import { getCommunityChats, saveCommunityChats, CommunityChats, CommunityMessage, getCommunityContacts, saveCommunityContacts, CommunityContact } from '../utils/storage';
import SendIcon from './icons/SendIcon';
import UserPlusIcon from './icons/UserPlusIcon';

const initialMockContacts: CommunityContact[] = [
    { id: 'ai_assistant', name: 'AI Assistant', avatar: `https://i.pravatar.cc/150?u=ai_assistant`, online: true },
    { id: 'artistic_alice', name: 'Artistic Alice', avatar: `https://i.pravatar.cc/150?u=artistic_alice`, online: true },
    { id: 'pixel_perfect', name: 'Pixel Perfect', avatar: `https://i.pravatar.cc/150?u=pixel_perfect`, online: false },
    { id: 'creative_bot', name: 'Creative Bot', avatar: `https://i.pravatar.cc/150?u=creative_bot`, online: true },
    { id: 'design_dave', name: 'Design Dave', avatar: `https://i.pravatar.cc/150?u=design_dave`, online: false },
];

const cannedReplies = [
    "That's really interesting!",
    "I see. Could you tell me more?",
    "Fascinating. What are your thoughts on it?",
    "Got it. Thanks for sharing that.",
    "That's a great point.",
    "I'll have to think about that.",
    "Wow, I hadn't considered that before."
];

const CommunityChat: React.FC = () => {
    const [contacts, setContacts] = useState<CommunityContact[]>(() => getCommunityContacts(initialMockContacts));
    const [chats, setChats] = useState<CommunityChats>(getCommunityChats());
    const [selectedContactId, setSelectedContactId] = useState<string>('ai_assistant');
    const [message, setMessage] = useState('');
    const [newContactName, setNewContactName] = useState('');
    const chatEndRef = useRef<HTMLDivElement>(null);

    const selectedContact = contacts.find(c => c.id === selectedContactId);
    const messages = chats[selectedContactId] || [];

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);
    
    const handleAddContact = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedName = newContactName.trim();
        if (!trimmedName) return;
    
        const existingContact = contacts.find(c => c.name.toLowerCase() === trimmedName.toLowerCase());
        if (existingContact) {
            setSelectedContactId(existingContact.id);
            setNewContactName('');
            return;
        }
        
        const newContact: CommunityContact = {
            id: trimmedName.toLowerCase().replace(/\s+/g, '_') + `_${Date.now()}`,
            name: trimmedName,
            avatar: `https://i.pravatar.cc/150?u=${encodeURIComponent(trimmedName)}`,
            online: Math.random() > 0.5,
        };
        
        const updatedContacts = [...contacts, newContact];
        setContacts(updatedContacts);
        saveCommunityContacts(updatedContacts);
        setSelectedContactId(newContact.id);
        setNewContactName('');
    };


    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!message.trim()) return;

        const newMessage: CommunityMessage = {
            id: Date.now().toString(),
            text: message,
            timestamp: new Date().toISOString(),
            sender: 'me',
        };
        
        const updatedChatsForContact = [...(chats[selectedContactId] || []), newMessage];
        const updatedChats = { ...chats, [selectedContactId]: updatedChatsForContact };

        setChats(updatedChats);
        saveCommunityChats(updatedChats);
        setMessage('');
        
        setTimeout(() => {
            const replyText = cannedReplies[Math.floor(Math.random() * cannedReplies.length)];
            const replyMessage: CommunityMessage = {
                id: (Date.now() + 1).toString(),
                text: replyText,
                timestamp: new Date().toISOString(),
                sender: 'them',
            };
            
            const finalChats = {
                ...updatedChats,
                [selectedContactId]: [...updatedChats[selectedContactId], replyMessage],
            };

            setChats(finalChats);
            saveCommunityChats(finalChats);
        }, 1500 + Math.random() * 1000);
    };

    return (
        <div className="h-full bg-slate-800/50 rounded-2xl shadow-2xl border border-slate-700/50 backdrop-blur-lg flex overflow-hidden">
            <aside className="w-1/3 border-r border-slate-700/50 flex flex-col">
                <header className="p-4 border-b border-slate-700/50 space-y-3">
                    <h2 className="text-xl font-bold text-slate-200">Community</h2>
                    <form onSubmit={handleAddContact} className="flex gap-2">
                        <input 
                            type="text" 
                            value={newContactName}
                            onChange={(e) => setNewContactName(e.target.value)}
                            placeholder="Add new contact..."
                            className="w-full p-2 text-sm bg-slate-900/70 border border-slate-700 rounded-lg focus:ring-1 focus:ring-cyan-500 outline-none"
                        />
                        <button type="submit" className="p-2 bg-slate-600 hover:bg-slate-500 rounded-lg"><UserPlusIcon /></button>
                    </form>
                </header>
                <ul className="overflow-y-auto flex-grow">
                    {contacts.map(contact => (
                        <li key={contact.id}>
                            <button
                                onClick={() => setSelectedContactId(contact.id)}
                                className={`w-full flex items-center gap-4 p-3 text-left transition-colors ${selectedContactId === contact.id ? 'bg-slate-700/70' : 'hover:bg-slate-800/50'}`}
                            >
                                <div className="relative">
                                    <img src={contact.avatar} alt={contact.name} className="w-12 h-12 rounded-full" />
                                    {contact.online && <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full bg-green-500 border-2 border-slate-800"></span>}
                                </div>
                                <div>
                                    <p className="font-semibold text-slate-200">{contact.name}</p>
                                    <p className="text-xs text-slate-400 truncate w-32">
                                        {chats[contact.id]?.slice(-1)[0]?.text || 'No messages yet'}
                                    </p>
                                </div>
                            </button>
                        </li>
                    ))}
                </ul>
            </aside>
            <main className="w-2/3 flex flex-col">
                {selectedContact ? (
                    <>
                        <header className="flex items-center gap-4 p-3 border-b border-slate-700/50 bg-slate-800/50">
                             <img src={selectedContact.avatar} alt={selectedContact.name} className="w-10 h-10 rounded-full" />
                             <div>
                                <p className="font-bold text-white">{selectedContact.name}</p>
                                <p className="text-xs text-slate-400">{selectedContact.online ? 'Online' : 'Offline'}</p>
                             </div>
                        </header>
                        <div className="flex-grow p-4 overflow-y-auto space-y-4">
                            {messages.map(msg => (
                                <div key={msg.id} className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-md p-3 rounded-lg text-sm ${msg.sender === 'me' ? 'bg-cyan-700' : 'bg-slate-700'}`}>
                                        <p>{msg.text}</p>
                                        <p className="text-xs text-slate-400/70 mt-1 text-right">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                    </div>
                                </div>
                            ))}
                            <div ref={chatEndRef} />
                        </div>
                        <footer className="p-3 bg-slate-800/50 border-t border-slate-700/50">
                            <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                                <input
                                    type="text"
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    placeholder="Type a message..."
                                    className="w-full p-2 bg-slate-700/50 border border-slate-600 rounded-lg focus:ring-2 focus:ring-cyan-500 transition-all outline-none"
                                />
                                <button type="submit" className="p-3 bg-cyan-600 hover:bg-cyan-700 rounded-lg disabled:opacity-50">
                                    <SendIcon />
                                </button>
                            </form>
                        </footer>
                    </>
                ) : (
                     <div className="flex items-center justify-center h-full text-slate-500">
                        <p>Select a contact to start chatting</p>
                    </div>
                )}
            </main>
        </div>
    );
};

export default CommunityChat;
