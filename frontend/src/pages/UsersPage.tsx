import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { getUsers, type UserPublic } from '../api/users'
import { TableSkeleton } from '../components/TableSkeleton'

const PER_PAGE_OPTIONS = [25, 50, 100] as const
const FIELD_OPTIONS = [
  { value: 'name', label: 'Name' },
  { value: 'website', label: 'Website' },
  { value: 'affiliation', label: 'Affiliation' },
  { value: 'country', label: 'Country' },
] as const

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

export function UsersPage() {
  const { user, loading: authLoading } = useAuth()
  const [users, setUsers] = useState<UserPublic[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(50)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchField, setSearchField] = useState<'name' | 'website' | 'affiliation' | 'country'>('name')
  const [submittedQuery, setSubmittedQuery] = useState('')
  const [submittedField, setSubmittedField] = useState<'name' | 'website' | 'affiliation' | 'country'>('name')

  const fetchUsers = useCallback(() => {
    setLoading(true)
    setError(null)
    const filters = submittedQuery.trim()
      ? { q: submittedQuery.trim(), field: submittedField, viewAdmin: true }
      : { viewAdmin: true }
    getUsers(page, perPage, filters)
      .then((res) => {
        setUsers(res.data)
        const pagination = res.meta?.pagination
        if (pagination) {
          setTotalPages(pagination.pages ?? 1)
          setTotal(pagination.total ?? 0)
        }
      })
      .catch(() => setError('Failed to load users.'))
      .finally(() => setLoading(false))
  }, [page, perPage, submittedQuery, submittedField])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

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
      <div className="page users-page">
        <div className="page-auth-required">
          <p>You need to be logged in to view users.</p>
          <Link to="/login" className="btn primary">Log in</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="page users-page">
      <div className="page-full-width">
        <header className="page-header users-page-header">
          <div>
            <h1>Users</h1>
            <p>Registered participants. Click a name to view their profile.</p>
          </div>
        </header>

        <form className="users-search-bar" onSubmit={handleSearch}>
          <label className="users-search-field-label">
            <select
              value={searchField}
              onChange={(e) => setSearchField(e.target.value as typeof searchField)}
              aria-label="Search field"
              className="users-search-field-select"
            >
              {FIELD_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <span className="users-search-field-arrow" aria-hidden>▼</span>
          </label>
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for matching users"
            className="users-search-input"
            aria-label="Search for matching users"
          />
          <button type="submit" className="users-search-btn" aria-label="Search">
            <SearchIcon />
          </button>
        </form>

        {loading && (
          <TableSkeleton columns={4} rows={12} className="users-table-skeleton" />
        )}

        {!loading && error && (
          <div className="page-error">
            <p>{error}</p>
          </div>
        )}

        {!loading && !error && (
          <>
            <div className="users-table-wrap">
              <table className="users-table">
                <thead>
                  <tr>
                    <th>USER</th>
                    <th>WEBSITE</th>
                    <th>AFFILIATION</th>
                    <th>COUNTRY</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td>
                        <Link to={`/users/${u.id}`} className="users-table-link">
                          {u.name}
                        </Link>
                      </td>
                      <td>
                        {u.website ? (
                          <a href={u.website.startsWith('http') ? u.website : `https://${u.website}`} target="_blank" rel="noopener noreferrer" className="users-table-external" title={u.website}>
                            <ExternalLinkIcon />
                          </a>
                        ) : (
                          ''
                        )}
                      </td>
                      <td>{u.affiliation ?? '—'}</td>
                      <td>{u.country ?? '—'}</td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr>
                      <td colSpan={4} className="users-table-empty">No users found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {(totalPages > 1 || total > perPage) && (
              <nav className="pagination users-pagination" aria-label="Users pagination">
                <label className="users-per-page">
                  <span className="users-per-page-label">Per page</span>
                  <select
                    value={perPage}
                    onChange={(e) => setPerPage(Number(e.target.value))}
                    aria-label="Users per page"
                    className="users-per-page-select"
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
