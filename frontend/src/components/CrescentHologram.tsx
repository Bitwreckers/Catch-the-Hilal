import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion'

export function CrescentHologram() {
  const rootRef = useRef<SVGSVGElement | null>(null)
  const prefersReduced = usePrefersReducedMotion()

  useEffect(() => {
    const root = rootRef.current
    if (!root || prefersReduced) return

    const ctx = gsap.context(() => {
      gsap.fromTo(
        root,
        { opacity: 0, scale: 0.9, rotate: -6 },
        {
          opacity: 1,
          scale: 1,
          rotate: 0,
          duration: 1.3,
          ease: 'power3.out',
        },
      )

      gsap.to(root, {
        rotate: 360,
        transformOrigin: '50% 50%',
        duration: 60,
        repeat: -1,
        ease: 'none',
      })

      gsap.to(root, {
        scale: 1.03,
        duration: 3.2,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      })

      gsap.to('.crescent-orbit', {
        rotate: 360,
        transformOrigin: '50% 50%',
        duration: 24,
        repeat: -1,
        ease: 'none',
      })
    }, root)

    return () => ctx.revert()
  }, [prefersReduced])

  return (
    <svg
      ref={rootRef}
      className="crescent-root"
      viewBox="0 0 200 200"
      role="presentation"
    >
      <defs>
        <radialGradient id="crescentGlow" cx="30%" cy="20%" r="70%">
          <stop offset="0%" stopColor="#fefce8" stopOpacity="1" />
          <stop offset="40%" stopColor="#d8c36a" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#020617" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="crescentStroke" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00e6a7" />
          <stop offset="100%" stopColor="#d8c36a" />
        </linearGradient>
      </defs>

      <circle
        cx="100"
        cy="100"
        r="70"
        fill="url(#crescentGlow)"
        opacity="0.3"
      />

      <path
        d="M135 40a65 65 0 1 0 0 120 52 52 0 0 1-15-38 52 52 0 0 1 15-38Z"
        fill="none"
        stroke="url(#crescentStroke)"
        strokeWidth="3"
        filter="url(#blur)"
      />

      <g className="crescent-orbit" opacity="0.9">
        <circle
          cx="100"
          cy="100"
          r="82"
          fill="none"
          stroke="rgba(148,163,184,0.25)"
          strokeDasharray="4 6"
        />
        <circle cx="180" cy="100" r="4" fill="#00e6a7" />
        <circle cx="20" cy="100" r="3" fill="#d8c36a" />
      </g>
    </svg>
  )
}

