import { useState, useRef, useEffect } from 'react'
import { getProbe } from '../utils/api'
import useSessionStore from '../store/sessionStore'

const DEPTH_COLORS = {
  1: '#94a3b8', 2: '#60a5fa', 3: '#34d399',
  4: '#fbbf24', 5: '#f97316', 6: '#ec4899',
  7: '#a78bfa', 8: '#6366f1',
}

const DEPTH_LABELS = {
  1: 'Clarification', 2: 'Assumptions', 3: 'Evidence',
  4: 'Viewpoints', 5: 'Implications', 6: 'Meta-Inquiry',
  7: 'Connections', 8: 'Reflection',
}

function DepthBar({ level, isActive, isReached }) {
  return (
    <div className="relative group">
      <div
        className="h-6 w-full rounded-sm transition-all duration-500 cursor-default"
        style={{
          backgroundColor: isActive
            ? DEPTH_COLORS[level]
            : isReached
              ? DEPTH_COLORS[level] + '40'
              : '#1e1e2e',
          boxShadow: isActive ? `0 0 12px ${DEPTH_COLORS[level]}60` : 'none',
        }}
      />
      {/* Tooltip on hover */}
      <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2
        bg-surface border border-border rounded-lg px-3 py-1.5
        text-xs text-white whitespace-nowrap opacity-0
        group-hover:opacity-100 transition-opacity z-50 pointer-events-none">
        <span className="font-mono text-slate-400">L{level}</span>
        <span className="ml-2">{DEPTH_LABELS[level]}</span>
      </div>
    </div>
  )
}

function TypingIndicator() {
  return (
    <div className="flex justify-start mb-4 fade-in-up">
      <div className="bg-surface border border-border rounded-2xl rounded-tl-sm
        px-5 py-4 max-w-xs">
        <div className="flex gap-1.5 items-center">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 bg-slate-400 rounded-full typing-dot"
              style={{ animationDelay: `${i * 0.2}s` }}
            />
          ))}
          <span className="text-slate-500 text-xs ml-1 font-mono">thinking...</span>
        </div>
      </div>
    </div>
  )
}

function Message({ msg, index }) {
  const isUser = msg.role === 'user'
  return (
    <div
      className={`flex mb-4 fade-in-up ${isUser ? 'justify-end' : 'justify-start'}`}
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      {/* AI avatar */}
      {!isUser && (
        <div className="w-8 h-8 rounded-xl bg-primary/20 border border-primary/30
          flex items-center justify-center text-sm mr-3 flex-shrink-0 mt-1">
          🪞
        </div>
      )}

      <div className={`max-w-sm lg:max-w-md xl:max-w-lg ${isUser ? 'items-end' : 'items-start'} flex flex-col`}>
        {/* Depth label for AI messages */}
        {!isUser && msg.depthLabel && (
          <div
            className="text-xs font-mono mb-1.5 flex items-center gap-1.5"
            style={{ color: DEPTH_COLORS[msg.depthUsed] }}
          >
            <div
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: DEPTH_COLORS[msg.depthUsed] }}
            />
            L{msg.depthUsed} · {msg.depthLabel}
          </div>
        )}

        {/* Message bubble */}
        <div
          className={`px-5 py-3.5 rounded-2xl text-sm leading-relaxed font-grotesk
            ${isUser
              ? 'bg-primary text-white rounded-tr-sm'
              : 'bg-surface border border-border text-slate-200 rounded-tl-sm'
            }`}
        >
          {msg.text}
        </div>
      </div>
    </div>
  )
}

export default function ChatScreen() {
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)
  const textareaRef = useRef(null)

  const {
    sessionId, topic, language,
    currentDepth, maxDepthReached,
    messages, conversationHistory,
    consecutiveShortResponses, turnNumber,
    addUserMessage, addAIMessage, updateDepth,
    reset,
  } = useSessionStore()

  // Auto scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const sendMessage = async () => {
    if (!input.trim() || loading) return

    const text = input.trim()
    setInput('')
    addUserMessage(text)
    setLoading(true)

    try {
      const result = await getProbe({
        session_id: sessionId,
        student_message: text,
        topic,
        conversation_history: conversationHistory,
        current_depth: currentDepth,
        language,
        consecutive_short_responses: consecutiveShortResponses,
        turn_number: turnNumber,
      })

      addAIMessage(result.probe, result.depth_used, result.depth_label)
      updateDepth(result.next_depth)
    } catch (e) {
      addAIMessage(
        'Something went wrong. Make sure the backend server is running.',
        currentDepth,
        'Error'
      )
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="h-screen bg-bg flex overflow-hidden">
      {/* ── LEFT SIDEBAR: Depth Meter ──────────────────────────────── */}
      <div className="w-16 flex-shrink-0 border-r border-border
        flex flex-col items-center py-6 gap-3">
        <span className="text-slate-600 text-xs font-mono uppercase tracking-widest
          [writing-mode:vertical-rl] rotate-180 mb-2">
          Depth
        </span>

        {/* Level bars — stacked bottom to top visually */}
        <div className="flex flex-col-reverse gap-1 w-8 flex-1">
          {Array.from({ length: 8 }, (_, i) => i + 1).map((level) => (
            <DepthBar
              key={level}
              level={level}
              isActive={level === currentDepth}
              isReached={level <= maxDepthReached}
            />
          ))}
        </div>

        {/* Current depth number */}
        <div
          className="text-lg font-mono font-bold"
          style={{ color: DEPTH_COLORS[currentDepth] }}
        >
          {currentDepth}
        </div>
      </div>

      {/* ── MAIN CHAT AREA ─────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="h-14 border-b border-border flex items-center
          justify-between px-6 flex-shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-xl">🪞</span>
            <div>
              <h1 className="text-white font-grotesk font-600 text-sm leading-tight">
                Socratic Mirror
              </h1>
              <p className="text-slate-500 text-xs font-mono truncate max-w-xs">
                {topic}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Depth badge */}
            <div
              className="px-3 py-1 rounded-lg border text-xs font-mono"
              style={{
                color: DEPTH_COLORS[currentDepth],
                borderColor: DEPTH_COLORS[currentDepth] + '40',
                backgroundColor: DEPTH_COLORS[currentDepth] + '15',
              }}
            >
              L{currentDepth} · {DEPTH_LABELS[currentDepth]}
            </div>

            {/* New session button */}
            <button
              onClick={reset}
              className="text-slate-500 hover:text-white border border-border
                hover:border-slate-600 px-3 py-1 rounded-lg text-xs
                font-grotesk transition-all duration-200"
            >
              New Session
            </button>
          </div>
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {/* Empty state */}
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="mirror-shimmer text-5xl mb-6">🪞</div>
              <h2 className="text-white font-grotesk font-600 text-xl mb-2">
                Ready to think deeper?
              </h2>
              <p className="text-slate-500 text-sm max-w-sm leading-relaxed">
                Share your understanding of <strong className="text-slate-300">{topic}</strong>.
                I will never give you the answer — I will only ask you better questions.
              </p>
              <div className="mt-8 flex gap-3 text-xs font-mono text-slate-600">
                <span className="border border-border rounded-lg px-3 py-2">
                  Start with what you know
                </span>
                <span className="border border-border rounded-lg px-3 py-2">
                  Even partial thoughts work
                </span>
              </div>
            </div>
          )}

          {/* Message list */}
          {messages.map((msg, i) => (
            <Message key={i} msg={msg} index={i} />
          ))}

          {/* Typing indicator */}
          {loading && <TypingIndicator />}

          <div ref={bottomRef} />
        </div>

        {/* Input area */}
        <div className="border-t border-border px-6 py-4 flex-shrink-0">
          <div className="flex gap-3 items-end">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Share your thinking... (Enter to send, Shift+Enter for new line)"
              rows={2}
              className="flex-1 bg-surface border border-border rounded-xl
                px-4 py-3 text-sm text-white placeholder-slate-600
                font-grotesk resize-none focus:outline-none
                focus:border-primary focus:ring-1 focus:ring-primary/50
                transition-all duration-200 leading-relaxed"
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              className="w-12 h-12 bg-primary hover:bg-glow disabled:opacity-30
                disabled:cursor-not-allowed rounded-xl flex items-center
                justify-center transition-all duration-200
                hover:shadow-lg hover:shadow-violet-500/30
                active:scale-95 flex-shrink-0"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.5">
                <path d="M22 2L11 13M22 2L15 22L11 13M11 13L2 9L22 2"/>
              </svg>
            </button>
          </div>
          <p className="text-slate-700 text-xs font-mono mt-2 text-center">
            Turn {turnNumber} · This AI will never answer — only ask
          </p>
        </div>
      </div>
    </div>
  )
}
