import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { getTeams, type TeamPublic } from '../api/teams'
import { TableSkeleton } from '../components/TableSkeleton'

const PER_PAGE_OPTIONS = [25, 50, 100] as const

export function TeamsListPage() {
  const { user, loading: authLoading } = useAuth()
  const [teams, setTeams] = useState<TeamPublic[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(50)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    getTeams(page, perPage)
      .then((res) => {
        if (cancelled) return
        setTeams(res.data)
        const pagination = res.meta?.pagination
        if (pagination) {
          setTotalPages(pagination.pages ?? 1)
          setTotal(pagination.total ?? 0)
        }
      })
      .catch(() => {
        if (!cancelled) setError('Failed to load teams.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [page, perPage])

  useEffect(() => {
    setPage(1)
  }, [perPage])

  if (!authLoading && !user) {
    return (
      <div className="page teams-list-page">
        <div className="page-auth-required">
          <p>You need to be logged in to view teams.</p>
          <Link to="/login" className="btn primary">Log in</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="page teams-list-page">
      <header className="page-header teams-list-page-header">
        <div>
          <h1>All Teams</h1>
          <p>Browse teams. Click a team to see its members.</p>
        </div>
        <div className="header-actions-row">
          <label className="per-page-select">
            <span className="per-page-label">Per page</span>
            <select
              value={perPage}
              onChange={(e) => setPerPage(Number(e.target.value))}
              aria-label="Teams per page"
              className="per-page-select-input"
            >
              {PER_PAGE_OPTIONS.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </label>
          <Link to="/team" className="btn ghost">My team</Link>
        </div>
      </header>

      {loading && (
        <TableSkeleton columns={4} rows={12} className="teams-table-skeleton" />
      )}

      {!loading && error && (
        <div className="page-error">
          <p>{error}</p>
        </div>
      )}

      {!loading && !error && (
        <>
          <div className="data-table-wrap data-table-wrap-teams">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Team</th>
                  <th>Website</th>
                  <th>Affiliation</th>
                  <th>Country</th>
                </tr>
              </thead>
              <tbody>
                {teams.map((t) => (
                  <tr key={t.id}>
                    <td>
                      <Link to={`/teams/${t.id}`} className="data-table-link">
                        {t.name}
                      </Link>
                    </td>
                    <td>
                      {t.website ? (
                        <a href={t.website.startsWith('http') ? t.website : `https://${t.website}`} target="_blank" rel="noopener noreferrer" className="data-table-link data-table-link-external">
                          {t.website}
                        </a>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td>{t.affiliation ?? '—'}</td>
                    <td>{t.country ?? '—'}</td>
                  </tr>
                ))}
                {teams.length === 0 && (
                  <tr>
                    <td colSpan={4} className="data-table-empty">No teams found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <nav className="pagination" aria-label="Teams pagination">
              <button
                type="button"
                className="btn ghost pagination-btn"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </button>
              <span className="pagination-info">
                Page {page} of {totalPages} ({total} total)
              </span>
              <button
                type="button"
                className="btn ghost pagination-btn"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </button>
            </nav>
          )}
        </>
      )}
    </div>
  )
}
