import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { getTeams, type TeamPublic, type TeamListField } from '../api/teams'
import { TableSkeleton } from '../components/TableSkeleton'

const PER_PAGE_OPTIONS = [25, 50, 100] as const
const FIELD_OPTIONS: { value: TeamListField; label: string }[] = [
  { value: 'name', label: 'Name' },
  { value: 'website', label: 'Website' },
  { value: 'affiliation', label: 'Affiliation' },
  { value: 'country', label: 'Country' },
]

function SearchIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  )
}

function ExternalLinkIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  )
}

export function TeamsListPage() {
  const { user, loading: authLoading } = useAuth()
  const [teams, setTeams] = useState<TeamPublic[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(50)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchField, setSearchField] = useState<TeamListField>('name')
  const [submittedQuery, setSubmittedQuery] = useState('')
  const [submittedField, setSubmittedField] = useState<TeamListField>('name')

  const fetchTeams = useCallback(() => {
    setLoading(true)
    setError(null)
    const filters = submittedQuery.trim() ? { q: submittedQuery.trim(), field: submittedField } : undefined
    getTeams(page, perPage, filters)
      .then((res) => {
        setTeams(res.data)
        const pagination = res.meta?.pagination
        if (pagination) {
          setTotalPages(pagination.pages ?? 1)
          setTotal(pagination.total ?? 0)
        }
      })
      .catch(() => setError('Failed to load teams.'))
      .finally(() => setLoading(false))
  }, [page, perPage, submittedQuery, submittedField])

  useEffect(() => {
    fetchTeams()
  }, [fetchTeams])

  useEffect(() => {
    setPage(1)
  }, [perPage, submittedQuery, submittedField])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmittedQuery(searchQuery.trim())
    setSubmittedField(searchField)
    setPage(1)
  }

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
      <div className="page-full-width teams-list-full-width">
        <header className="page-header teams-list-page-header">
          <div>
            <h1>Teams</h1>
            <p>Browse teams. Click a team to see its members.</p>
          </div>
          <Link to="/team" className="btn ghost">My team</Link>
        </header>

        <form className="teams-search-bar" onSubmit={handleSearch}>
        <label className="teams-search-field-label">
          <select
            value={searchField}
            onChange={(e) => setSearchField(e.target.value as TeamListField)}
            aria-label="Search field"
            className="teams-search-field-select"
          >
            {FIELD_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <span className="teams-search-field-arrow" aria-hidden>▼</span>
        </label>
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search for matching teams"
          className="teams-search-input"
          aria-label="Search for matching teams"
        />
        <button type="submit" className="teams-search-btn" aria-label="Search">
          <SearchIcon />
        </button>
      </form>

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
          <div className="teams-table-wrap">
            <table className="teams-table">
              <thead>
                <tr>
                  <th>TEAM</th>
                  <th>WEBSITE</th>
                  <th>AFFILIATION</th>
                  <th>COUNTRY</th>
                </tr>
              </thead>
              <tbody>
                {teams.map((t) => (
                  <tr key={t.id}>
                    <td>
                      <Link to={`/teams/${t.id}`} className="teams-table-link">
                        {t.name}
                      </Link>
                    </td>
                    <td>
                      {t.website ? (
                        <a href={t.website.startsWith('http') ? t.website : `https://${t.website}`} target="_blank" rel="noopener noreferrer" className="teams-table-external" title={t.website}>
                          <ExternalLinkIcon />
                        </a>
                      ) : (
                        ''
                      )}
                    </td>
                    <td>{t.affiliation ?? '—'}</td>
                    <td>{t.country ?? '—'}</td>
                  </tr>
                ))}
                {teams.length === 0 && (
                  <tr>
                    <td colSpan={4} className="teams-table-empty">No teams found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {(totalPages > 1 || total > perPage) && (
            <nav className="pagination teams-pagination" aria-label="Teams pagination">
              <label className="teams-per-page">
                <span className="teams-per-page-label">Per page</span>
                <select
                  value={perPage}
                  onChange={(e) => setPerPage(Number(e.target.value))}
                  aria-label="Teams per page"
                  className="teams-per-page-select"
                >
                  {PER_PAGE_OPTIONS.map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </label>
              {totalPages > 1 && (
                <>
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
                </>
              )}
            </nav>
          )}
        </>
      )}
      </div>
    </div>
  )
}
