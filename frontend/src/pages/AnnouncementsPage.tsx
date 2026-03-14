import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { getAnnouncements } from '../api/announcements'

type AnnouncementType = 'info' | 'schedule' | 'critical' | 'writeups' | 'hint'

interface Announcement {
  id: number
  title: string
  body: string
  created_at: string
  type: AnnouncementType
  hint_for?: string | null
}

function inferType(a: { title?: string; body?: string }): AnnouncementType {
  const text = `${a.title ?? ''} ${a.body ?? ''}`.toLowerCase()
  if (text.includes('hint')) return 'hint'
  if (text.includes('writeup')) return 'writeups'
  if (text.includes('schedule') || text.includes('start') || text.includes('freeze')) return 'schedule'
  if (text.includes('urgent') || text.includes('incident') || text.includes('downtime')) return 'critical'
  return 'info'
}

function extractHintTarget(a: { title?: string; body?: string }): string | null {
  const text = `${a.title ?? ''} ${a.body ?? ''}`

  // Try formats like: "Hint for ChallengeName", "Hint: ChallengeName"
  const forMatch = text.match(/hint\s+(?:for|عن)\s+["']?([^"'\n]+)["']?/i)
  if (forMatch?.[1]) return forMatch[1].trim()

  const colonMatch = text.match(/hint[:：]\s*([^.\n]+)/i)
  if (colonMatch?.[1]) return colonMatch[1].trim()

  return null
}

export function AnnouncementsPage() {
  const { user, loading } = useAuth()
  const [items, setItems] = useState<Announcement[]>([])
  useEffect(() => {
    ;(async () => {
      try {
        const data = await getAnnouncements()
        setItems(
          data
            .map((a: any) => {
              const body = a.content ?? a.body ?? ''
              const created_at = a.created || a.created_at || ''
              const type = inferType({ title: a.title, body })
              const hint_for = type === 'hint' ? extractHintTarget({ title: a.title, body }) : null
              return {
                id: a.id,
                title: a.title,
                body,
                created_at,
                type,
                hint_for,
              } as Announcement
            })
            .sort((a: Announcement, b: Announcement) => b.created_at.localeCompare(a.created_at)),
        )
      } catch {
        setItems([])
      }
    })()
  }, [])

  if (!loading && !user) {
    return (
      <div className="page announcements-page">
        <div className="page-auth-required">
          <p>You need to be logged in to view announcements.</p>
          <Link to="/login" className="btn primary">Log in</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="page announcements-page">
      <header className="page-header announcements-header">
        <div>
          <h1>Announcements</h1>
          <p>Follow live updates, schedule changes, and challenge hints during the CTF.</p>
        </div>
        <div className="announcements-status-pill">Live updates</div>
      </header>

      <section className="announcements-timeline">
        <div className="announcements-line" aria-hidden="true" />
        <div className="announcements-list">
          {items.map((a) => (
            <article key={a.id} className={`announcement-card announcement-${a.type}`}>
              <div className="announcement-dot" aria-hidden="true" />
              <div className="announcement-content">
                <header className="announcement-header">
                  <h2>{a.title}</h2>
                  <span className={`announcement-type tag-${a.type}`}>
                    {a.type === 'hint' ? 'Hint' : a.type}
                  </span>
                </header>
                <p className="announcement-meta">{a.created_at}</p>
                {a.type === 'hint' && a.hint_for && (
                  <p className="announcement-hint-target">
                    Hint for challenge: <strong>{a.hint_for}</strong>
                  </p>
                )}
                <p className="announcement-body">{a.body}</p>
              </div>
            </article>
          ))}
          {items.length === 0 && (
            <p className="announcements-empty">No announcements yet.</p>
          )}
        </div>
      </section>
    </div>
  )
}

