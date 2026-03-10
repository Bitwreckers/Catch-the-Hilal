import { useEffect, useMemo, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { gsap } from 'gsap'
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion'
import crescentMoonImg from '../assets/crescent-moon.png'

const STAR_COUNT = 120

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
  const prefersReduced = usePrefersReducedMotion()
  const location = useLocation()
  const isLanding = location.pathname === '/'
  const stars = useStarfield()

  useEffect(() => {
    const root = rootRef.current
    if (!root || prefersReduced) return

    const ctx = gsap.context(() => {
      /* Small moon float on non-landing pages */
      const moon = moonRef.current
      if (moon) {
        gsap.to(moon, {
          y: '+=12',
          duration: 4,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
        })
        gsap.to(moon, {
          x: '+=8',
          duration: 5,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
          delay: 0.5,
        })
        gsap.to(moon, {
          rotation: 8,
          duration: 8,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
        })
      }
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
      {!isLanding && (
        <div className="global-moon" ref={moonRef} aria-hidden>
          <img src={crescentMoonImg} alt="" role="presentation" />
        </div>
      )}
    </div>
  )
}
