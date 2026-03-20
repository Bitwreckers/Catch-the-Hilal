import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { CountdownTimer } from '../components/CountdownTimer'
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion'
import { getCtfTime } from '../api/ctf'
import crescentMoonImg from '../assets/crescent-moon.png'
import jsLogoImg from '../assets/jslogo.png'

type CountdownState =
  | { mode: 'starts'; target: string; label: string }
  | { mode: 'ends'; target: string; label: string }
  | { mode: 'ended'; label: string }
  | { mode: 'tbd'; label: string }

/** يعتمد فقط على إعدادات الأدمن: Config → Start and End Time */
function computeCountdownState(start: string | null, end: string | null): CountdownState {
  const now = Date.now()
  const startMs = start ? new Date(start).getTime() : 0
  const endMs = end ? new Date(end).getTime() : 0

  if (start && startMs > now) return { mode: 'starts', target: start, label: 'Event starts in' }
  if (end && endMs > now) return { mode: 'ends', target: end, label: 'Event ends in' }
  if ((start && startMs <= now) || (end && endMs <= now)) return { mode: 'ended', label: 'Event has ended' }
  return { mode: 'tbd', label: 'Event time will be announced' }
}

/* Four moons at the corner positions; some flipped, some with scroll parallax */
const MOON_POSITIONS: {
  className: string
  size: string
  flip?: boolean
  parallax?: boolean
}[] = [
  { className: 'moon-top-left', size: 'moon-lg', parallax: true },
  { className: 'moon-bottom-left', size: 'moon-lg', flip: true },
  { className: 'moon-top-right', size: 'moon-lg', flip: true },
  { className: 'moon-bottom-right', size: 'moon-md', parallax: true },
]

export function LandingPage() {
  const navigate = useNavigate()
  const heroRef = useRef<HTMLDivElement | null>(null)
  const moonsRef = useRef<HTMLDivElement | null>(null)
  const prefersReduced = usePrefersReducedMotion()
  const [ctfStart, setCtfStart] = useState<string | null>(null)
  const [ctfEnd, setCtfEnd] = useState<string | null>(null)

  const countdownState = computeCountdownState(ctfStart, ctfEnd)

  const fetchCtfTime = () => {
    getCtfTime().then(({ start, end }) => {
      setCtfStart(start ?? null)
      setCtfEnd(end ?? null)
    })
  }

  useEffect(() => {
    fetchCtfTime()
    const retry = setTimeout(fetchCtfTime, 1500)
    return () => clearTimeout(retry)
  }, [])

  useEffect(() => {
    const onFocus = () => fetchCtfTime()
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [])

  gsap.registerPlugin(ScrollTrigger)

  useEffect(() => {
    if (!heroRef.current || prefersReduced) return

    const ctx = gsap.context(() => {
      const letters = gsap.utils.toArray<HTMLElement>('.hero-title-letter')

      const tl = gsap.timeline()
      tl.from('.hero-card', {
        y: 40,
        opacity: 0,
        scale: 0.96,
        duration: 1,
        ease: 'power3.out',
      })
        .from(
          '.hero-pill',
          {
            y: -16,
            opacity: 0,
            duration: 0.6,
            ease: 'power2.out',
          },
          '-=0.6',
        )
        .from(
          '.hero-subtitle',
          {
            y: 20,
            opacity: 0,
            duration: 0.7,
            ease: 'power2.out',
          },
          '-=0.4',
        )
        .from(
          '.hero-actions .btn',
          {
            y: 16,
            opacity: 0,
            stagger: 0.08,
            duration: 0.6,
            ease: 'power2.out',
          },
          '-=0.3',
        )
        .from(
          '.hero-countdown',
          {
            y: 12,
            opacity: 0,
            duration: 0.6,
            ease: 'power2.out',
          },
          '-=0.25',
        )

      // Repeating terminal-style typing for "عيدكم مبارك"
      const typingTl = gsap.timeline({
        repeat: -1,
        repeatDelay: 3.5,
        delay: 0.4,
      })

      typingTl.set(letters, { opacity: 0, y: 0 })
      typingTl.to(letters, {
        opacity: 1,
        duration: 0.6,
        stagger: 0.06,
        ease: 'power2.out',
      })

      /* Continuous professional animations – subtle, always-on */
      const heroCard = heroRef.current?.querySelector<HTMLElement>('.hero-card')
      if (heroCard) {
        gsap.fromTo(
          heroCard,
          {
            boxShadow:
              '0 0 0 1px rgba(251, 191, 36, 0.28), 0 0 40px rgba(251, 191, 36, 0.08), 0 32px 64px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.08)',
          },
          {
            boxShadow:
              '0 0 0 1px rgba(251, 191, 36, 0.4), 0 0 56px rgba(251, 191, 36, 0.12), 0 36px 72px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)',
            duration: 3,
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut',
          },
        )
      }
      gsap.fromTo(
        '.hero-pill',
        { opacity: 0.88 },
        { opacity: 1, duration: 2.4, repeat: -1, yoyo: true, ease: 'sine.inOut' },
      )
      gsap.utils.toArray<HTMLElement>('.hero-countdown .countdown-box').forEach((box, i) => {
        gsap.fromTo(
          box,
          { boxShadow: '0 0 0 1px rgba(245, 197, 66, 0.18)' },
          {
            boxShadow:
              '0 0 14px rgba(245, 197, 66, 0.12), 0 0 0 1px rgba(245, 197, 66, 0.32)',
            duration: 2.8 + i * 0.15,
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut',
            delay: i * 0.12,
          },
        )
      })

      if (moonsRef.current) {
        /* Float on .eid-moon-float so parallax scrub on parent doesn't override transform */
        gsap.utils.toArray<HTMLElement>('.eid-moon-float').forEach((el, i) => {
          const wrap = el.closest('.moon-parallax')
          const isLeft = (wrap ?? el).className.includes('left')
          const xPercent = isLeft ? -40 : 40
          const floatY = 18 + (i % 2) * 6
          const floatX = 12 + (i % 3) * 4
          const dirY = i % 2 === 0 ? 1 : -1
          const dirX = i % 3 === 0 ? -1 : 1

          gsap.set(el, { xPercent })

          gsap.to(el, {
            y: `+=${dirY * floatY}`,
            duration: 5 + i * 0.6,
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut',
            delay: i * 0.35,
          })

          gsap.to(el, {
            x: `+=${dirX * floatX}`,
            duration: 4.5 + (i % 2) * 1.2,
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut',
            delay: i * 0.25,
          })

          gsap.to(el, {
            rotation: (i % 2 === 0 ? 1 : -1) * (12 + i * 4),
            duration: 22 + i * 2.5,
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut',
            delay: i * 0.45,
          })

          gsap.to(el, {
            scale: 1.12,
            duration: 3.2 + i * 0.4,
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut',
            delay: i * 0.5,
          })
        })

        gsap.utils.toArray<HTMLElement>('.moon-parallax').forEach((wrap) => {
          const isLeft = wrap.className.includes('left')
          gsap.set(wrap, { xPercent: isLeft ? -40 : 40 })
          gsap.fromTo(
            wrap,
            { y: 0 },
            {
              y: 90,
              ease: 'none',
              scrollTrigger: {
                trigger: heroRef.current!,
                start: 'top top',
                end: 'bottom bottom',
                scrub: 1.2,
              },
            },
          )
        })
      }
    }, heroRef)

    return () => ctx.revert()
  }, [prefersReduced])

  return (
    <div className={`page landing-page${prefersReduced ? ' reduced-motion' : ''}`} ref={heroRef}>
      <div className="landing-backdrop" ref={moonsRef} aria-hidden>
        {MOON_POSITIONS.map(({ className, size, flip, parallax }, i) => {
          const isLeft = className.includes('left')
          const moonInner = (
            <div
              className={`eid-moon ${parallax ? (isLeft ? 'moon-left' : 'moon-right') : ''} ${size}${flip ? ' moon-flip' : ''}`}
              style={{ ['--i' as string]: i }}
            >
              <img src={crescentMoonImg} alt="" role="presentation" />
            </div>
          )
          const floatClass = parallax ? 'eid-moon-float' : `eid-moon-float ${className}`
          const moonEl = <div className={floatClass}>{moonInner}</div>
          return parallax ? (
            <div key={i} className={`moon-parallax ${className}`}>
              {moonEl}
            </div>
          ) : (
            <div key={i}>{moonEl}</div>
          )
        })}
      </div>

      <section className="hero">
        <div className="hero-card">
          <div className="hero-card-inner">
            <img src={jsLogoImg} alt="" className="hero-logo-badge" aria-hidden />
            <div className="hero-pill">EID EDITION</div>
            <h1 className="hero-title">
              {'عيدكم مبارك'.split('').map((ch, idx) => (
                <span key={idx} className="hero-title-letter">
                  {ch === ' ' ? '\u00A0' : ch}
                </span>
              ))}
            </h1>
            <p className="hero-brand">CATCH THE HILAL CTF</p>
            <p className="hero-subtitle">
              On the night of Eid, step into a sleek{' '}
              <span className="hero-subtitle-accent">terminal-style cyber arena</span>. Hack, exploit,
              and capture the crescent flags before time runs out.
            </p>
            <div className="hero-actions">
              <button
                className="btn primary"
                onClick={() => navigate('/challenges')}
              >
                View Challenges
              </button>
            </div>
            <div className="hero-countdown">
              {countdownState && (
                <>
                  <h2>{countdownState.label}</h2>
                  {countdownState.mode === 'ended' ? (
                    <p className="hero-countdown-ended">Event has ended</p>
                  ) : countdownState.mode === 'tbd' ? (
                    <p className="hero-countdown-ended">Event time will be announced</p>
                  ) : (
                    <CountdownTimer target={countdownState.target} />
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
