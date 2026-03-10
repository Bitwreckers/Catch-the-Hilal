import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { CountdownTimer } from '../components/CountdownTimer'
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion'
import { getCtfTime } from '../api/ctf'
import crescentMoonImg from '../assets/crescent-moon.png'
import jsLogoImg from '../assets/jslogo.png'

const FALLBACK_START = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString()

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
  const [startTime, setStartTime] = useState<string>(
    () => import.meta.env.VITE_CTF_START_TIME || FALLBACK_START
  )

  const fetchStartTime = () => {
    getCtfTime()
      .then(({ start }) => {
        if (start) setStartTime(start)
      })
      .catch(() => {})
  }

  useEffect(() => {
    fetchStartTime()
    const retry = setTimeout(fetchStartTime, 1500)
    return () => clearTimeout(retry)
  }, [])

  useEffect(() => {
    const onFocus = () => fetchStartTime()
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

      // Repeating terminal-style typing for "EID MUBARAK"
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
              '0 0 0 1px rgba(251, 191, 36, 0.22), 0 24px 48px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)',
          },
          {
            boxShadow:
              '0 0 0 1px rgba(251, 191, 36, 0.38), 0 28px 56px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.08)',
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

      // Scroll-driven \"presentation\" animations for sections
      gsap.from('.section-how .how-grid', {
        opacity: 0,
        y: 40,
        duration: 0.9,
        ease: 'power3.out',
        clearProps: 'transform',
        scrollTrigger: {
          trigger: '.section-how',
          start: 'top 70%',
        },
      })
      gsap.from('.section-how .how-card', {
        opacity: 0,
        y: 36,
        scale: 0.96,
        duration: 0.9,
        ease: 'power3.out',
        stagger: 0.12,
        clearProps: 'transform',
        scrollTrigger: {
          trigger: '.section-how',
          start: 'top 65%',
        },
      })

      gsap.from('.section-about .page-header', {
        opacity: 0,
        y: 40,
        duration: 0.9,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: '.section-about',
          start: 'top 75%',
        },
      })
      gsap.from('.section-about .panel', {
        opacity: 0,
        y: 32,
        duration: 0.9,
        ease: 'power3.out',
        stagger: 0.16,
        scrollTrigger: {
          trigger: '.section-about',
          start: 'top 70%',
        },
      })

      gsap.from('.section-categories .category-card', {
        opacity: 0,
        y: 40,
        rotateX: -12,
        duration: 0.9,
        ease: 'power3.out',
        stagger: 0.12,
        transformOrigin: 'top center',
        scrollTrigger: {
          trigger: '.section-categories',
          start: 'top 72%',
        },
      })

      gsap.from('.section-schedule .timeline li', {
        opacity: 0,
        x: -24,
        duration: 0.7,
        ease: 'power3.out',
        stagger: 0.16,
        scrollTrigger: {
          trigger: '.section-schedule',
          start: 'top 70%',
        },
      })

      gsap.from('.section-protocols .panel-terminal', {
        opacity: 0,
        y: 40,
        duration: 0.8,
        ease: 'power3.out',
        stagger: 0.14,
        scrollTrigger: {
          trigger: '.section-protocols',
          start: 'top 72%',
        },
      })

      gsap.from('.section-teams .prize-card', {
        opacity: 0,
        y: 48,
        duration: 1,
        ease: 'power3.out',
        stagger: 0.18,
        scrollTrigger: {
          trigger: '.section-teams',
          start: 'top 72%',
        },
      })

      gsap.from('.section-final-cta .final-cta', {
        opacity: 0,
        y: 40,
        scale: 0.96,
        duration: 0.9,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: '.section-final-cta',
          start: 'top 75%',
        },
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
              {'EID MUBARAK'.split('').map((ch, idx) => (
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
                onClick={() => navigate('/register')}
              >
                Register
              </button>
              <button
                className="btn ghost hero-cta-challenges"
                onClick={() => navigate('/challenges')}
              >
                View Challenges
              </button>
            </div>
            <div className="hero-countdown">
              <h2>Event starts in</h2>
              <CountdownTimer target={startTime} />
            </div>
          </div>
        </div>

        <div className="scroll-indicator" aria-hidden="true">
          <span className="scroll-indicator-dot" />
        </div>
      </section>

      <section className="hero-secondary section-reveal section-how">
        <h3>How it works</h3>
        <div className="how-grid">
          <div className="how-card">
            <span className="how-step">01</span>
            <h4>Capture the flag</h4>
            <p>Analyze the challenge, find the vulnerability, and obtain the flag.</p>
          </div>
          <div className="how-card">
            <span className="how-step">02</span>
            <h4>Submit securely</h4>
            <p>Send your flag through the platform and get instant feedback.</p>
          </div>
          <div className="how-card">
            <span className="how-step">03</span>
            <h4>Earn points</h4>
            <p>Score based on challenge difficulty and speed of solving.</p>
          </div>
          <div className="how-card">
            <span className="how-step">04</span>
            <h4>Climb the board</h4>
            <p>Watch your team rise on the live scoreboard under the Eid crescent.</p>
          </div>
        </div>
      </section>

      <section className="section-reveal landing-section about-section section-about">
        <div className="page-header section-heading">
          <h1>What is Catch the Hilal?</h1>
          <p>
            An Eid cybersecurity CTF where teams race to capture flags under a glowing digital
            crescent in a terminal-inspired arena.
          </p>
        </div>
        <div className="about-grid">
          <div className="panel">
            <h2>Format</h2>
            <p>Jeopardy-style board with multiple categories and challenge values.</p>
          </div>
          <div className="panel">
            <h2>Duration</h2>
            <p>Intense multi-hour event with a live scoreboard and announcements.</p>
          </div>
          <div className="panel">
            <h2>Skill levels</h2>
            <p>From beginners to seasoned players – all are welcome.</p>
          </div>
        </div>
      </section>

      <section className="section-reveal landing-section categories-section section-categories">
        <div className="page-header section-heading">
          <h1>Challenge fields</h1>
          <p>Explore core disciplines of offensive security.</p>
        </div>
        <div className="card-grid">
          {['Web', 'Crypto', 'Forensics', 'Reverse', 'Pwn', 'OSINT'].map((name) => (
            <article key={name} className="category-card">
              <header>
                <span className="category-tag">{name.toUpperCase()}</span>
                <h2>{name}</h2>
              </header>
              <p>
                Carefully crafted challenges to test your {name.toLowerCase()} skills under
                pressure.
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="section-reveal landing-section schedule-section section-schedule">
        <div className="page-header section-heading">
          <h1>Schedule</h1>
          <p>Stay in sync with the event timeline.</p>
        </div>
        <ul className="timeline">
          <li>
            <span className="timeline-label">Registration</span>
            <span className="timeline-detail">Opens before the event – create or join a team.</span>
          </li>
          <li>
            <span className="timeline-label">Start</span>
            <span className="timeline-detail">Board unlocks and flags become available.</span>
          </li>
          <li>
            <span className="timeline-label">Freeze</span>
            <span className="timeline-detail">Scoreboard may freeze near the end.</span>
          </li>
          <li>
            <span className="timeline-label">Closing</span>
            <span className="timeline-detail">Winners announced and writeups shared.</span>
          </li>
        </ul>
      </section>

      <section className="section-reveal landing-section rules-section section-protocols">
        <div className="page-header section-heading">
          <h1>Protocols</h1>
          <p>Respect the arena and fellow players.</p>
        </div>
        <div className="rules-grid">
          <div className="panel-terminal">
            <h2>Registration protocol</h2>
            <p>Use valid contact details and follow the event&apos;s eligibility rules.</p>
          </div>
          <div className="panel-terminal">
            <h2>Team policy</h2>
            <p>Create or join one team only. No cross-team flag sharing.</p>
          </div>
          <div className="panel-terminal">
            <h2>Flag format</h2>
            <p>Flags usually look like CTF&#123;...&#125; – always read each challenge description.</p>
          </div>
          <div className="panel-terminal">
            <h2>Anti-cheating rules</h2>
            <p>No attacking the infrastructure or other participants. No automated bruteforce.</p>
          </div>
        </div>
      </section>

      <section className="section-reveal landing-section prizes-section section-teams">
        <div className="page-header section-heading">
          <h1>Teams under the crescent</h1>
          <p>Celebrate how your crew prepares, plays, and levels up together.</p>
        </div>
        <div className="prizes-grid">
          <div className="prize-card prize-first">
            <h2>Squad formation</h2>
            <p>Assemble a balanced team, sync your tools, and align on a game plan before the board unlocks.</p>
          </div>
          <div className="prize-card prize-second">
            <h2>In-game collaboration</h2>
            <p>Pair on hard challenges, share notes and payloads, and rotate roles as the clock counts down.</p>
          </div>
          <div className="prize-card prize-third">
            <h2>Post‑Eid debrief</h2>
            <p>Review writeups, refine your playbook, and get ready for the next Catch the Hilal edition.</p>
          </div>
        </div>
      </section>

      <section className="section-reveal landing-section final-cta-section section-final-cta">
        <div className="final-cta">
          <h1>Enter the Catch the Hilal Arena</h1>
          <p>Gather your team, sharpen your skills, and await the opening bell.</p>
          <div className="hero-actions">
            <button className="btn primary" onClick={() => navigate('/register')}>
              Register now
            </button>
            <button className="btn ghost" onClick={() => navigate('/challenges')}>
              View Challenges
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
