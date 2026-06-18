import { useState } from 'react'
import { startSession } from '../utils/api'
import useSessionStore from '../store/sessionStore'

const SUGGESTED_TOPICS = [
  "Newton's Second Law",
  "Photosynthesis",
  "French Revolution",
  "Recursion in Programming",
  "Supply and Demand",
  "DNA Replication",
]

export default function LandingScreen() {
  const [topic, setTopic] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { setScreen, setSessionId, setTopic: storeTopic, language, setLanguage } =
    useSessionStore()

  const handleStart = async (selectedTopic) => {
    const finalTopic = selectedTopic || topic.trim()
    if (!finalTopic) { setError('Please enter a topic first.'); return }

    setLoading(true)
    setError('')
    try {
      const data = await startSession(finalTopic, language)
      setSessionId(data.session_id)
      storeTopic(finalTopic)
      setScreen('chat')
    } catch (e) {
      setError('Could not connect to server. Make sure backend is running.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-4 py-12">
      {/* Background gradient blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px]
          bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px]
          bg-violet-900/10 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 w-full max-w-xl">
        {/* Logo */}
        <div className="text-center mb-12">
          <div className="mirror-shimmer text-6xl mb-4">🪞</div>
          <h1 className="font-grotesk font-700 text-4xl text-white tracking-tight mb-2">
            Socratic Mirror
          </h1>
          <p className="text-slate-400 text-lg font-light">
            An AI that never answers — only asks.
          </p>
          <p className="text-slate-600 text-sm mt-2">
            Built for thinkers. Not shortcuts.
          </p>
        </div>

        {/* Main card */}
        <div className="bg-surface border border-border rounded-2xl p-8 glow-violet">
          {/* Language toggle */}
          <div className="flex items-center justify-between mb-6">
            <label className="text-slate-400 text-sm font-mono uppercase tracking-wider">
              Language
            </label>
            <div className="flex bg-bg rounded-xl p-1 border border-border">
              {['english', 'kannada'].map((lang) => (
                <button
                  key={lang}
                  onClick={() => setLanguage(lang)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-grotesk transition-all duration-200
                    ${language === lang
                      ? 'bg-primary text-white shadow-lg'
                      : 'text-slate-400 hover:text-white'
                    }`}
                >
                  {lang === 'english' ? 'EN' : 'ಕನ್ನಡ'}
                </button>
              ))}
            </div>
          </div>

          {/* Topic input */}
          <div className="mb-4">
            <label className="block text-slate-400 text-sm font-mono uppercase tracking-wider mb-2">
              What are you thinking about?
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => { setTopic(e.target.value); setError('') }}
              onKeyDown={(e) => e.key === 'Enter' && handleStart()}
              placeholder="e.g. Photosynthesis, Recursion, French Revolution..."
              className="w-full bg-bg border border-border rounded-xl px-4 py-3.5
                text-white placeholder-slate-600 font-grotesk text-base
                focus:outline-none focus:border-primary focus:ring-1
                focus:ring-primary transition-all duration-200"
            />
            {error && (
              <p className="text-red-400 text-sm mt-2">{error}</p>
            )}
          </div>

          {/* Start button */}
          <button
            onClick={() => handleStart()}
            disabled={loading || !topic.trim()}
            className="w-full bg-primary hover:bg-glow disabled:opacity-40
              disabled:cursor-not-allowed text-white font-grotesk font-600
              text-base py-4 rounded-xl transition-all duration-200
              shadow-lg hover:shadow-violet-500/30 hover:shadow-xl
              active:scale-[0.98]"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white
                  rounded-full animate-spin" />
                Starting session...
              </span>
            ) : (
              'Start Thinking →'
            )}
          </button>
        </div>

        {/* Suggested topics */}
        <div className="mt-8">
          <p className="text-center text-slate-600 text-sm font-mono uppercase tracking-wider mb-4">
            Try one of these
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            {SUGGESTED_TOPICS.map((t) => (
              <button
                key={t}
                onClick={() => handleStart(t)}
                className="px-4 py-2 bg-surface border border-border rounded-xl
                  text-slate-400 hover:text-white hover:border-primary/50
                  text-sm font-grotesk transition-all duration-200
                  hover:bg-primary/10"
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Footer tag */}
        <p className="text-center text-slate-700 text-xs mt-10 font-mono">
          PI Labs · PES University · Built for Bharat
        </p>
      </div>
    </div>
  )
}
