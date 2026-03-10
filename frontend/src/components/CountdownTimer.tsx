import { useEffect, useState } from 'react'

interface CountdownTimerProps {
  target: string // ISO date string
}

function getTimeRemaining(target: string) {
  const targetTime = new Date(target).getTime()
  const now = Date.now()
  const diff = Math.max(targetTime - now, 0)

  const seconds = Math.floor((diff / 1000) % 60)
  const minutes = Math.floor((diff / 1000 / 60) % 60)
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24)
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  return { days, hours, minutes, seconds }
}

export function CountdownTimer({ target }: CountdownTimerProps) {
  const [time, setTime] = useState(() => getTimeRemaining(target))
  const [tick, setTick] = useState(false)

  useEffect(() => {
    const id = setInterval(() => setTime(getTimeRemaining(target)), 1000)
    return () => clearInterval(id)
  }, [target])

  useEffect(() => {
    setTick(true)
    const t = setTimeout(() => setTick(false), 500)
    return () => clearTimeout(t)
  }, [time.seconds])

  return (
    <div className="countdown-root">
      <div className="countdown-item" key="countdown-days">
        <div className="countdown-box">
          <span className="countdown-bracket">[</span>
          <span className="countdown-value">
            {time.days.toString().padStart(2, '0')}
          </span>
          <span className="countdown-bracket">]</span>
        </div>
        <span className="countdown-label">Days</span>
      </div>
      <div className="countdown-item" key="countdown-hours">
        <div className="countdown-box">
          <span className="countdown-bracket">[</span>
          <span className="countdown-value">
            {time.hours.toString().padStart(2, '0')}
          </span>
          <span className="countdown-bracket">]</span>
        </div>
        <span className="countdown-label">Hours</span>
      </div>
      <div className="countdown-item" key="countdown-minutes">
        <div className="countdown-box">
          <span className="countdown-bracket">[</span>
          <span className="countdown-value">
            {time.minutes.toString().padStart(2, '0')}
          </span>
          <span className="countdown-bracket">]</span>
        </div>
        <span className="countdown-label">Minutes</span>
      </div>
      <div className="countdown-item" key="countdown-seconds">
        <div
          className={`countdown-box countdown-box--seconds${tick ? ' countdown-box--tick' : ''}`}
        >
          <span className="countdown-bracket">[</span>
          <span className="countdown-value">
            {time.seconds.toString().padStart(2, '0')}
          </span>
          <span className="countdown-bracket">]</span>
        </div>
        <span className="countdown-label">Seconds</span>
      </div>
    </div>
  )
}

