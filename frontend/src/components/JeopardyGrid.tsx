import { Link } from 'react-router-dom'

export interface JeopardyChallenge {
  id: number
  name: string
  category: string
  value: number
  solved: boolean
}

interface JeopardyGridProps {
  challenges: JeopardyChallenge[]
}

export function JeopardyGrid({ challenges }: JeopardyGridProps) {
  const categories = Array.from(new Set(challenges.map((c) => c.category))).sort()

  const grouped: Record<string, JeopardyChallenge[]> = {}
  for (const c of challenges) {
    if (!grouped[c.category]) grouped[c.category] = []
    grouped[c.category].push(c)
  }

  for (const cat of categories) {
    grouped[cat].sort((a, b) => a.value - b.value)
  }

  const maxLength =
    categories.length > 0
      ? Math.max(...categories.map((c) => grouped[c]?.length ?? 0), 0)
      : 0

  return (
    <div className="jeopardy-grid">
      <div className="jeopardy-row jeopardy-header-row">
        {categories.map((cat) => (
          <div key={cat} className="jeopardy-header">
            {cat}
          </div>
        ))}
      </div>
      <div className="jeopardy-body">
        {Array.from({ length: maxLength }, (_, rowIndex) => (
          <div key={rowIndex} className="jeopardy-row">
            {categories.map((cat) => {
              const challenge = grouped[cat][rowIndex]
              if (!challenge) {
                return <div key={`${cat}-${rowIndex}-empty`} className="jeopardy-cell empty" />
              }
              return (
                <Link
                  key={`${challenge.id}-${cat}-${rowIndex}`}
                  to={`/challenges/${challenge.id}`}
                  className={`jeopardy-cell ${
                    challenge.solved ? 'jeopardy-cell-solved' : ''
                  }`}
                >
                  <span className="value">{challenge.value}</span>
                </Link>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}


