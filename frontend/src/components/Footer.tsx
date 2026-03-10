import bitwreckersLogo from '../assets/bitwreckers-logo.png'
import jsLogo from '../assets/jslogo.png'
import {
  FaInstagram,
  FaWhatsapp,
  FaLinkedinIn,
  FaTelegramPlane,
  FaYoutube,
  FaFacebookF,
} from 'react-icons/fa'

export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="footer-root">
      <div className="footer-inner">
        <div className="footer-main">
          <div className="footer-brand">
            <div className="footer-logo-mark">
              <img src={jsLogo} alt="Jordan Cyber Club logo" className="footer-logo-img" />
            </div>
            <div className="footer-text">
              <h2>Jordan Cyber Club</h2>
              <p>
                We are the Jordan Cyber Club team, striving to raise awareness of cybersecurity and
                develop youth skills in Jordan.
              </p>
            </div>
          </div>

          <div className="footer-social">
            <span className="footer-social-label">Find us</span>
            <div className="footer-social-links">
              <a
                href="https://www.instagram.com/jo_cyber_club"
                target="_blank"
                rel="noreferrer"
                className="footer-social-icon footer-social-icon-instagram"
              >
                <span className="sr-only">Instagram</span>
                <FaInstagram aria-hidden />
              </a>
              <a
                href="https://chat.whatsapp.com/Iyd4K2JPDtdGVOLITZCsJk"
                target="_blank"
                rel="noreferrer"
                className="footer-social-icon footer-social-icon-whatsapp"
              >
                <span className="sr-only">WhatsApp</span>
                <FaWhatsapp aria-hidden />
              </a>
              <a
                href="https://www.linkedin.com/company/jordan-cyber-club/"
                target="_blank"
                rel="noreferrer"
                className="footer-social-icon footer-social-icon-linkedin"
              >
                <span className="sr-only">LinkedIn</span>
                <FaLinkedinIn aria-hidden />
              </a>
              <a
                href="https://t.me/JordanCyberClub"
                target="_blank"
                rel="noreferrer"
                className="footer-social-icon footer-social-icon-telegram"
              >
                <span className="sr-only">Telegram</span>
                <FaTelegramPlane aria-hidden />
              </a>
              <a
                href="https://www.youtube.com/@jordan_cyber_club"
                target="_blank"
                rel="noreferrer"
                className="footer-social-icon footer-social-icon-youtube"
              >
                <span className="sr-only">YouTube</span>
                <FaYoutube aria-hidden />
              </a>
              <a
                href="https://web.facebook.com/profile.php?id=61561579136900&mibextid=ZbWKwL&_rdc=1&_rdr#"
                target="_blank"
                rel="noreferrer"
                className="footer-social-icon footer-social-icon-facebook"
              >
                <span className="sr-only">Facebook</span>
                <FaFacebookF aria-hidden />
              </a>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p className="footer-copy">© {year} Catch the Hilal CTF · Jordan Cyber Club.</p>
          <div className="footer-developed">
            <span>Developed by</span>
            <a href="https://www.bitwreckers.com/" target="_blank" rel="noreferrer" className="footer-dev-link">
              <img src={bitwreckersLogo} alt="Bitwreckers" className="footer-dev-logo" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}

