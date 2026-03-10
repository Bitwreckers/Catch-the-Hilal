import { useEffect, useState } from 'react'

export function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return

    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(query.matches)

    const handler = (event: MediaQueryListEvent) => {
      setReduced(event.matches)
    }

    const anyQuery = query as any
    if (anyQuery.addEventListener) {
      anyQuery.addEventListener('change', handler)
    } else if (anyQuery.addListener) {
      anyQuery.addListener(handler)
    }

    return () => {
      if (anyQuery.removeEventListener) {
        anyQuery.removeEventListener('change', handler)
      } else if (anyQuery.removeListener) {
        anyQuery.removeListener(handler)
      }
    }
  }, [])

  return reduced
}

