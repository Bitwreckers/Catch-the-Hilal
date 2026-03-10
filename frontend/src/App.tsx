import { Routes, Route } from 'react-router-dom'
import { LandingPage } from './pages/LandingPage'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { ForgotPasswordPage } from './pages/ForgotPasswordPage'
import { DashboardPage } from './pages/DashboardPage'
import { ChallengesBoardPage } from './pages/ChallengesBoardPage'
import { ChallengeDetailPage } from './pages/ChallengeDetailPage'
import { ScoreboardPage } from './pages/ScoreboardPage'
import { TeamPage } from './pages/TeamPage'
import { TeamSettingsPage } from './pages/TeamSettingsPage'
import { TeamsListPage } from './pages/TeamsListPage'
import { TeamDetailPage } from './pages/TeamDetailPage'
import { UsersPage } from './pages/UsersPage'
import { UserProfilePage } from './pages/UserProfilePage'
import { RulesPage } from './pages/RulesPage'
import { AnnouncementsPage } from './pages/AnnouncementsPage'
import { ProfilePage } from './pages/ProfilePage'
import { SettingsPage } from './pages/SettingsPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { Navbar } from './components/Navbar'
import { Footer } from './components/Footer'
import { CyberBackdrop } from './components/CyberBackdrop'

function App() {
  return (
    <div className="app-root">
      <CyberBackdrop />
      <Navbar />
      <main className="app-main">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/reset-password" element={<ForgotPasswordPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/challenges" element={<ChallengesBoardPage />} />
          <Route path="/challenges/:id" element={<ChallengeDetailPage />} />
          <Route path="/scoreboard" element={<ScoreboardPage />} />
          <Route path="/team" element={<TeamPage />} />
          <Route path="/team/settings" element={<TeamSettingsPage />} />
          <Route path="/teams" element={<TeamsListPage />} />
          <Route path="/teams/:id" element={<TeamDetailPage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/users/:id" element={<UserProfilePage />} />
          <Route path="/rules" element={<RulesPage />} />
          <Route path="/announcements" element={<AnnouncementsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/settings" element={<SettingsPage />} />

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}

export default App

