import { Link } from "react-router-dom";

const Navbar = () => {
  return (
    <nav style={{ background: '#2c2f34', padding: '1rem' }}>
      <ul style={{ display: 'flex', gap: '1rem', listStyle: 'none', margin: 0 }}>
        <li><Link to="/" style={{ color: 'white', textDecoration: 'none' }}>Ana Sayfa</Link></li>
        <li><Link to="/projects" style={{ color: 'white', textDecoration: 'none' }}>Projeler</Link></li>
        <li><Link to="/settings" style={{ color: 'white', textDecoration: 'none' }}>Ayarlar</Link></li>
      </ul>
    </nav>
  );
};

export default Navbar;
