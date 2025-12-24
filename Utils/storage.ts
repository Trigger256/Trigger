
const CREATIONS_KEY = 'triggerAiCreations';
const CHAT_HISTORY_KEY = 'triggerAiChatHistory';
const COMMUNITY_CHATS_KEY = 'triggerAiCommunityChats';
const COMMUNITY_CONTACTS_KEY = 'triggerAiCommunityContacts';
const VIDEO_PROJECTS_KEY = 'triggerAiVideoProjects';

type ChatMessage = {
    role: 'user' | 'model';
    text?: string;
    imageUrl?: string;
    imageName?: string;
    audioUrl?: string;
};

export type CommunityMessage = {
    id: string;
    text: string;
    timestamp: string;
    sender: 'me' | 'them';
}

export type CommunityContact = {
    id: string;
    name: string;
    avatar: string;
    online: boolean;
}

export type CommunityChats = {
    [contactId: string]: CommunityMessage[];
}

export type VideoProject = {
    id: string;
    name: string;
    timeline: any[]; // Define a proper type for timeline clips later
    createdAt: string;
    updatedAt: string;
}

// == Creations Management ==

export function getCreations(): string[] {
    try {
        const creations = localStorage.getItem(CREATIONS_KEY);
        return creations ? JSON.parse(creations) : [];
    } catch (error) {
        console.error("Failed to retrieve creations from localStorage:", error);
        return [];
    }
}

export function saveCreation(imageUrl: string) {
    try {
        const creations = getCreations();
        // Add the new creation to the beginning of the list
        const updatedCreations = [imageUrl, ...creations];
        localStorage.setItem(CREATIONS_KEY, JSON.stringify(updatedCreations));
    } catch (error) {
        console.error("Failed to save creation to localStorage:", error);
    }
}

// == AI Chat History Management ==

export function getChatHistory(): ChatMessage[] | null {
     try {
        const history = localStorage.getItem(CHAT_HISTORY_KEY);
        return history ? JSON.parse(history) : null;
    } catch (error) {
        console.error("Failed to retrieve chat history from localStorage:", error);
        return null;
    }
}

export function saveChatHistory(history: ChatMessage[]) {
    try {
        localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(history));
    } catch (error) {
        console.error("Failed to save chat history to localStorage:", error);
    }
}

export function clearChatHistory() {
    try {
        localStorage.removeItem(CHAT_HISTORY_KEY);
    } catch (error) {
        console.error("Failed to clear chat history from localStorage:", error);
    }
}

// == Community Chat Management ==

export function getCommunityChats(): CommunityChats {
    try {
        const chats = localStorage.getItem(COMMUNITY_CHATS_KEY);
        return chats ? JSON.parse(chats) : {};
    } catch (error) {
        console.error("Failed to retrieve community chats from localStorage:", error);
        return {};
    }
}

export function saveCommunityChats(chats: CommunityChats) {
    try {
        localStorage.setItem(COMMUNITY_CHATS_KEY, JSON.stringify(chats));
    } catch (error) {
        console.error("Failed to save community chats to localStorage:", error);
    }
}

export function getCommunityContacts(defaultContacts: CommunityContact[]): CommunityContact[] {
    try {
        const contacts = localStorage.getItem(COMMUNITY_CONTACTS_KEY);
        return contacts ? JSON.parse(contacts) : defaultContacts;
    } catch (error) {
        console.error("Failed to retrieve community contacts from localStorage:", error);
        return defaultContacts;
    }
}

export function saveCommunityContacts(contacts: CommunityContact[]) {
    try {
        localStorage.setItem(COMMUNITY_CONTACTS_KEY, JSON.stringify(contacts));
    } catch (error) {
        console.error("Failed to save community contacts to localStorage:", error);
    }
}

// == Video Project Management ==

export function getVideoProjects(): VideoProject[] {
    try {
        const projects = localStorage.getItem(VIDEO_PROJECTS_KEY);
        return projects ? JSON.parse(projects) : [];
    } catch (error) {
        console.error("Failed to retrieve video projects from localStorage:", error);
        return [];
    }
}

export function saveVideoProjects(projects: VideoProject[]) {
    try {
        localStorage.setItem(VIDEO_PROJECTS_KEY, JSON.stringify(projects));
    } catch (error) {
        console.error("Failed to save video projects to localStorage:", error);
    }
}


// == General Data Management ==

export function clearAllData() {
    try {
        localStorage.removeItem(CREATIONS_KEY);
        localStorage.removeItem(CHAT_HISTORY_KEY);
        localStorage.removeItem(COMMUNITY_CHATS_KEY);
        localStorage.removeItem(COMMUNITY_CONTACTS_KEY);
        localStorage.removeItem(VIDEO_PROJECTS_KEY);
    } catch (error) {
        console.error("Failed to clear all data from localStorage:", error);
    }
}
