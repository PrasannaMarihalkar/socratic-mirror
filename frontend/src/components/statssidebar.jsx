import useSessionStore from '../store/sessionStore'

const DEPTH_COLORS = {
  1: '#94a3b8', 2: '#60a5fa', 3: '#34d399',
  4: '#fbbf24', 5: '#f97316', 6: '#ec4899',
  7: '#a78bfa', 8: '#6366f1',
}

function StatCard({ label, value, color }) {
  return (
    <div className="bg-bg border border-border rounded-xl p-4">
      <p className="text-slate-500 text-xs font-mono uppercase tracking-wider mb-1">
        {label}
      </p>
      <p className="text-2xl font-mono font-bold" style={{ color: color || '#e2e8f0' }}>
        {value}
      </p>
    </div>
  )
}

function DepthProgressBar({ level, isReached, isCurrent }) {
  const LABELS = {
    1: 'Clarification', 2: 'Assumptions', 3: 'Evidence',
    4: 'Viewpoints', 5: 'Implications', 6: 'Meta-Inquiry',
    7: 'Connections', 8: 'Reflection',
  }
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs font-mono w-4 text-right flex-shrink-0"
        style={{ color: isReached ? DEPTH_COLORS[level] : '#334155' }}>
        {level}
      </span>
      <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700"
          style={{
            width: isReached ? '100%' : '0%',
            backgroundColor: DEPTH_COLORS[level],
            boxShadow: isCurrent ? `0 0 8px ${DEPTH_COLORS[level]}` : 'none',
          }}
        />
      </div>
      <span className="text-xs font-grotesk w-24 flex-shrink-0 truncate"
        style={{ color: isReached ? '#94a3b8' : '#334155' }}>
        {LABELS[level]}
      </span>
    </div>
  )
}

export default function StatsSidebar() {
  const { currentDepth, maxDepthReached, messages, turnNumber } = useSessionStore()

  const userMessages = messages.filter((m) => m.role === 'user')
  const aiMessages = messages.filter((m) => m.role === 'assistant')

  const avgWordCount = userMessages.length > 0
    ? Math.round(
        userMessages.reduce((acc, m) => acc + m.text.split(' ').length, 0)
        / userMessages.length
      )
    : 0

  return (
    <div className="w-64 flex-shrink-0 border-l border-border bg-surface flex flex-col overflow-y-auto">
      <div className="p-5 border-b border-border">
        <h2 className="text-white font-grotesk font-600 text-sm">Session Stats</h2>
        <p className="text-slate-600 text-xs font-mono mt-0.5">Live thinking metrics</p>
      </div>

      <div className="p-5 flex flex-col gap-4">

        <div className="grid grid-cols-2 gap-2">
          <StatCard label="Turn" value={turnNumber - 1} color="#e2e8f0" />
          <StatCard label="Max Depth" value={`L${maxDepthReached}`} color={DEPTH_COLORS[maxDepthReached]} />
          <StatCard label="Avg Words" value={avgWordCount} color="#60a5fa" />
          <StatCard label="Questions" value={aiMessages.length} color="#a78bfa" />
        </div>

        <div>
          <p className="text-slate-500 text-xs font-mono uppercase tracking-wider mb-3">
            Depth Progression
          </p>
          <div className="flex flex-col gap-2">
            {Array.from({ length: 8 }, (_, i) => i + 1).map((level) => (
              <DepthProgressBar
                key={level}
                level={level}
                isReached={level <= maxDepthReached}
                isCurrent={level === currentDepth}
              />
            ))}
          </div>
        </div>

        <div>
          <p className="text-slate-500 text-xs font-mono uppercase tracking-wider mb-3">
            Thinking Quality
          </p>
          <div className="bg-bg border border-border rounded-xl p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-slate-400 text-xs font-grotesk">Reasoning Depth</span>
              <span className="text-xs font-mono font-bold" style={{ color: DEPTH_COLORS[currentDepth] }}>
                {Math.round((maxDepthReached / 8) * 100)}%
              </span>
            </div>
            <div className="h-2 bg-border rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${(maxDepthReached / 8) * 100}%`,
                  background: `linear-gradient(90deg, #7c3aed, ${DEPTH_COLORS[maxDepthReached]})`,
                }}
              />
            </div>
            <p className="text-slate-600 text-xs font-mono mt-2">
              {maxDepthReached <= 2 && 'Just getting started'}
              {maxDepthReached === 3 && 'Building reasoning'}
              {maxDepthReached === 4 && 'Exploring perspectives'}
              {maxDepthReached === 5 && 'Deep thinking'}
              {maxDepthReached === 6 && 'Critical inquiry'}
              {maxDepthReached === 7 && 'Making connections'}
              {maxDepthReached === 8 && '🎯 Full reflection reached'}
            </p>
          </div>
        </div>

        <div className="bg-primary/10 border border-primary/20 rounded-xl p-4">
          <p className="text-primary text-xs font-mono uppercase tracking-wider mb-2">💡 Tip</p>
          <p className="text-slate-400 text-xs font-grotesk leading-relaxed">
            {currentDepth <= 2 && 'Define your terms precisely. Clarity unlocks deeper questions.'}
            {currentDepth === 3 && 'Back your claims with evidence or examples from memory.'}
            {currentDepth === 4 && 'Try to argue the opposing side genuinely.'}
            {currentDepth === 5 && "Think about what must be true if your position holds."}
            {currentDepth === 6 && 'Ask yourself why this concept matters beyond the exam.'}
            {currentDepth === 7 && 'Find the pattern — where else does this show up?'}
            {currentDepth === 8 && 'Articulate exactly what shifted in your thinking today.'}
          </p>
        </div>

      </div>
    </div>
  )
}