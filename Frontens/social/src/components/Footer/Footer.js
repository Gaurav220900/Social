import { Link } from "react-router-dom";
import { FaFacebook, FaTwitter, FaInstagram, FaGithub } from "react-icons/fa";
import styles from "./Footer.module.css";
import { useSelector } from "react-redux";

export default function Footer() {
  const user = useSelector((state) => state.auth.user);
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        {/* Brand */}
        <div className={styles.brand}>
          <h2>SocialApp</h2>
          <p>Connect, share and explore with friends around the world.</p>
        </div>

        {/* Links */}
        <div className={styles.links}>
          <h3>Quick Links</h3>
          <Link to="/">Home</Link>
          <Link to={`profile/${user?._id}`}>Profile</Link>
          <Link to="/notifications">Notifications</Link>
        </div>

        {/* Social */}
        <div className={styles.social}>
          <h3>Follow Us</h3>
          <div className={styles.icons}>
            <a href="https://facebook.com" target="_blank" rel="noreferrer">
              <FaFacebook />
            </a>
            <a href="https://twitter.com" target="_blank" rel="noreferrer">
              <FaTwitter />
            </a>
            <a href="https://instagram.com" target="_blank" rel="noreferrer">
              <FaInstagram />
            </a>
            <a href="https://github.com" target="_blank" rel="noreferrer">
              <FaGithub />
            </a>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className={styles.bottom}>
        © {new Date().getFullYear()} SocialApp. All rights reserved.
      </div>
    </footer>
  );
}
