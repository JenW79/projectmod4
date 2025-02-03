import { useState, useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { FaUserCircle } from 'react-icons/fa';
import * as sessionActions from '../../store/session';

function ProfileButton({ user }) {
  const dispatch = useDispatch();
  const [showMenu, setShowMenu] = useState(false);
  const ulRef = useRef();

  const toggleMenu = (e) => {
    e.stopPropagation(); 
    setShowMenu((prev) => !prev);
  };

  useEffect(() => {
    if (!showMenu) return;

    const closeMenu = (e) => {
      if (ulRef.current && !ulRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    };

    document.addEventListener('click', closeMenu);
    return () => document.removeEventListener('click', closeMenu);
  }, [showMenu]);

  const logout = (e) => {
    e.preventDefault();
    dispatch(sessionActions.logout());
  };

  return (
    <div className="profile-container">
      <button onClick={toggleMenu} className="profile-icon">
        <FaUserCircle size={24} />
      </button>
      {showMenu && (
        <ul className="profile-dropdown" ref={ulRef}>
          <li>{user.username}</li>
          <li>{user.firstName} {user.lastName}</li>
          <li>{user.email}</li>
          <li>
            <button className="logout-button" onClick={logout}>Log Out</button> 
          </li>
        </ul>
      )}
    </div>
  );
}

export default ProfileButton;
