import { create } from 'zustand'

const useSessionStore = create((set, get) => ({
  sessionId: null,
  topic: '',
  language: 'english',
  currentDepth: 1,
  maxDepthReached: 1,
  messages: [],
  conversationHistory: [],
  consecutiveShortResponses: 0,
  turnNumber: 1,
  screen: 'landing',

  setScreen: (s) => set({ screen: s }),
  setTopic: (t) => set({ topic: t }),
  setLanguage: (l) => set({ language: l }),
  setSessionId: (id) => set({ sessionId: id }),

  addUserMessage: (text) => set((state) => ({
    messages: [...state.messages, { role: 'user', text }],
    conversationHistory: [...state.conversationHistory, { role: 'user', content: text }],
    consecutiveShortResponses: text.trim().split(' ').length < 5
      ? state.consecutiveShortResponses + 1 : 0,
  })),

  addAIMessage: (text, depthUsed, depthLabel) => set((state) => ({
    messages: [...state.messages, { role: 'assistant', text, depthUsed, depthLabel }],
    conversationHistory: [...state.conversationHistory, { role: 'assistant', content: text }],
  })),

  updateDepth: (nextDepth) => set((state) => ({
    currentDepth: nextDepth,
    maxDepthReached: Math.max(state.maxDepthReached, nextDepth),
    turnNumber: state.turnNumber + 1,
  })),

  reset: () => set({
    sessionId: null, topic: '', language: 'english',
    currentDepth: 1, maxDepthReached: 1, messages: [],
    conversationHistory: [], consecutiveShortResponses: 0,
    turnNumber: 1, screen: 'landing',
  }),
}))

export default useSessionStore