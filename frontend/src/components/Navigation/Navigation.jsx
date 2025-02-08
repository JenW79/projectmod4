import { NavLink } from 'react-router-dom';
import { useSelector } from 'react-redux';
import ProfileButton from './ProfileButton';
import './Navigation.css';
import logo from '../../../../images/logo.png';

function Navigation({ isLoaded }) {
  const sessionUser = useSelector(state => state.session.user);

  return (
    <nav className="navbar">
      <ul className="nav-links">
        <li>
        <NavLink to="/">
        <img src={logo} alt="App Logo" className="logo" />
        </NavLink>
        </li>
      </ul>
     
      {isLoaded && <ProfileButton user={sessionUser} />}
    </nav>
  );
}

export default Navigation;