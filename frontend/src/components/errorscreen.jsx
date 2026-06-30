import useSessionStore from '../store/sessionStore'

export default function ErrorScreen() {
  const reset = useSessionStore((s) => s.reset)

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center">
      <div className="text-6xl mb-6">🪞</div>
      <h1 className="text-white font-grotesk font-700 text-2xl mb-2">
        The mirror is cloudy.
      </h1>
      <p className="text-slate-500 text-sm mb-8">
        Something went wrong. Check that the backend server is running.
      </p>
      <button
        onClick={reset}
        className="bg-primary hover:bg-glow text-white font-grotesk px-6 py-3 rounded-xl transition-all duration-200"
      >
        Start Over
      </button>
    </div>
  )
}