import { useEffect, useMemo, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { gsap } from 'gsap'
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion'
import crescentMoonImg from '../assets/crescent-moon.png'

const STAR_COUNT = 260

function useGalaxyfield() {
  return useMemo(() => {
    const list: { left: number; top: number; size: number; delay: number; duration: number; opacity: number }[] = []
    const GALAXY_COUNT = 4

    for (let i = 0; i < GALAXY_COUNT; i++) {
      const left = 10 + Math.random() * 80
      const top = 10 + Math.random() * 80
      const size = 260 + Math.random() * 220

      list.push({
        left,
        top,
        size,
        delay: Math.random() * 20,
        duration: 40 + Math.random() * 40,
        opacity: 0.16 + Math.random() * 0.14,
      })
    }

    return list
  }, [])
}

function useStarfield() {
  return useMemo(() => {
    const list: { left: number; top: number; size: number; delay: number; duration: number }[] = []
    const seen = new Set<string>()
    for (let i = 0; i < STAR_COUNT; i++) {
      let left = Math.floor(Math.random() * 100)
      let top = Math.floor(Math.random() * 100)
      let key = `${left},${top}`
      let tries = 0
      while (seen.has(key) && tries < 50) {
        left = Math.floor(Math.random() * 100)
        top = Math.floor(Math.random() * 100)
        key = `${left},${top}`
        tries++
      }
      seen.add(key)
      list.push({
        left,
        top,
        size: Math.random() > 0.7 ? 2 : 1,
        delay: Math.random() * 4,
        duration: 3 + Math.random() * 4,
      })
    }
    return list
  }, [])
}

export function CyberBackdrop() {
  const rootRef = useRef<HTMLDivElement | null>(null)
  const moonRef = useRef<HTMLDivElement | null>(null)
  const extraMoonRef = useRef<HTMLDivElement | null>(null)
  const prefersReduced = usePrefersReducedMotion()
  const location = useLocation()
  const isLanding = location.pathname === '/'
  const stars = useStarfield()
  const galaxies = useGalaxyfield()

  useEffect(() => {
    const root = rootRef.current
    if (!root || prefersReduced) return

    const ctx = gsap.context(() => {
      /* Small moon float on non-landing pages */
      const moonEls = [moonRef.current, extraMoonRef.current].filter(Boolean) as HTMLDivElement[]
      moonEls.forEach((moon, index) => {
        const baseDelay = index * 0.7
        gsap.to(moon, {
          y: `+=${10 + index * 4}`,
          duration: 4 + index,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
          delay: baseDelay,
        })
        gsap.to(moon, {
          x: `+=${7 + index * 3}`,
          duration: 5 + index * 0.8,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
          delay: baseDelay + 0.5,
        })
        gsap.to(moon, {
          rotation: 10 + index * 4,
          duration: 9 + index * 2,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
          delay: baseDelay + 0.3,
        })
      })
    }, root)

    return () => ctx.revert()
  }, [prefersReduced, isLanding])

  return (
    <div
      className={`cyber-backdrop${prefersReduced ? ' reduced-motion' : ''}`}
      aria-hidden="true"
      ref={rootRef}
    >
      <div className="cb-layer cb-base" />
      <div className="global-starfield">
        {stars.map((s, i) => (
          <span
            key={i}
            className="global-star"
            style={{
              left: `${s.left}%`,
              top: `${s.top}%`,
              width: s.size,
              height: s.size,
              animationDelay: `${s.delay}s`,
              animationDuration: `${s.duration}s`,
            }}
          />
        ))}
      </div>
      <div className="galaxy-layer">
        {galaxies.map((g, i) => (
          <div
            key={i}
            className="galaxy"
            style={{
              left: `${g.left}%`,
              top: `${g.top}%`,
              width: `${g.size}px`,
              height: `${g.size * 0.7}px`,
              animationDelay: `${g.delay}s`,
              animationDuration: `${g.duration}s`,
              opacity: g.opacity,
            }}
          />
        ))}
      </div>
      {!isLanding && (
        <>
          <div className="global-moon global-moon-primary" ref={moonRef} aria-hidden>
            <img src={crescentMoonImg} alt="" role="presentation" />
          </div>
          <div className="global-moon global-moon-secondary" ref={extraMoonRef} aria-hidden>
            <img src={crescentMoonImg} alt="" role="presentation" />
          </div>
        </>
      )}
    </div>
  )
}
