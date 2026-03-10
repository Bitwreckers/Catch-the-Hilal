export function RulesPage() {
  return (
    <div className="page rules-page">
      <header className="page-header rules-header">
        <h1>Protocols &amp; fair play</h1>
        <p>
          Treat the arena like production: respect other players, the infrastructure, and the spirit of
          the Catch the Hilal CTF.
        </p>
      </header>

      <section className="rules-grid-shell">
        <div className="rules-section">
          <h2>Fair play</h2>
          <ul>
            <li>Do not attack the platform infrastructure or other participants in any way.</li>
            <li>Only interact with services and endpoints that are part of the CTF environment.</li>
            <li>
              Use your own accounts and teams — no impersonation, account sharing, or multi-account abuse.
            </li>
          </ul>
        </div>

        <div className="rules-section">
          <h2>Flags &amp; scoring</h2>
          <ul>
            <li>Flags typically follow the format CTF&#123;...&#125; unless a challenge states otherwise.</li>
            <li>Do not share flags across teams or leak them publicly during the event.</li>
            <li>Points are awarded per valid submission; ties may be broken by submission time.</li>
          </ul>
        </div>

        <div className="rules-section">
          <h2>Prohibited activity</h2>
          <ul>
            <li>Automated bruteforcing and denial-of-service attacks are strictly forbidden.</li>
            <li>Out-of-scope targets include organizers&apos; personal accounts and unrelated services.</li>
            <li>Any attempt to disrupt the event or other teams may result in disqualification.</li>
          </ul>
        </div>

        <div className="rules-section">
          <h2>Timing &amp; integrity</h2>
          <ul>
            <li>Respect the announced competition start and end times.</li>
            <li>Flags submitted after the end time will not be counted.</li>
            <li>All organizer decisions regarding disputes and scoring are final.</li>
          </ul>
        </div>

        <div className="rules-section">
          <h2>Reporting issues</h2>
          <ul>
            <li>If you discover a bug in the platform, report it privately to the organizers.</li>
            <li>Do not use platform bugs to gain unfair advantage or access other teams&apos; data.</li>
            <li>Have fun, learn, and help us keep the arena safe for everyone.</li>
          </ul>
        </div>
      </section>
    </div>
  )
}

