import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { getUsers, type UserPublic } from '../api/users'
import { TableSkeleton } from '../components/TableSkeleton'

const PER_PAGE_OPTIONS = [25, 50, 100] as const

export function UsersPage() {
  const { user, loading: authLoading } = useAuth()
  const [users, setUsers] = useState<UserPublic[]>([])
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
    getUsers(page, perPage)
      .then((res) => {
        if (cancelled) return
        setUsers(res.data)
        const pagination = res.meta?.pagination
        if (pagination) {
          setTotalPages(pagination.pages ?? 1)
          setTotal(pagination.total ?? 0)
        }
      })
      .catch(() => {
        if (!cancelled) setError('Failed to load users.')
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
      <header className="page-header users-page-header">
        <div>
          <h1>Users</h1>
          <p>Registered participants. Click a name to view their profile.</p>
        </div>
        <label className="per-page-select">
          <span className="per-page-label">Per page</span>
          <select
            value={perPage}
            onChange={(e) => setPerPage(Number(e.target.value))}
            aria-label="Users per page"
            className="per-page-select-input"
          >
            {PER_PAGE_OPTIONS.map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </label>
      </header>

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
          <div className="data-table-wrap data-table-wrap-users">
            <table className="data-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Website</th>
                  <th>Affiliation</th>
                  <th>Country</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <Link to={`/users/${u.id}`} className="data-table-link">
                        {u.name}
                      </Link>
                    </td>
                    <td>
                      {u.website ? (
                        <a href={u.website.startsWith('http') ? u.website : `https://${u.website}`} target="_blank" rel="noopener noreferrer" className="data-table-link data-table-link-external">
                          {u.website}
                        </a>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td>{u.affiliation ?? '—'}</td>
                    <td>{u.country ?? '—'}</td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={4} className="data-table-empty">No users found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <nav className="pagination" aria-label="Users pagination">
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
