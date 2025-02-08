import { useState, useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { FaUserCircle } from 'react-icons/fa';
import { FiMenu } from 'react-icons/fi';
import * as sessionActions from '../../store/session';
import { NavLink } from "react-router-dom";
import OpenModalMenuItem from './OpenModalMenuItem';
import LoginFormModal from '../LoginFormModal/LoginFormModal';
import SignupFormModal from '../SignupFormModal/SignupFormModal';

function ProfileButton({ user }) {
  const dispatch = useDispatch();
  const [showMenu, setShowMenu] = useState(false);
  const ulRef = useRef();

  // Toggle dropdown menu
  const toggleMenu = (e) => {
    e.stopPropagation();
    setShowMenu((prev) => !prev);
  };

  // Close menu when clicking outside
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

  // Close menu when modal opens or user logs out
  const closeMenu = () => setShowMenu(false);

  const logout = (e) => {
    e.preventDefault();
    dispatch(sessionActions.logout());
    closeMenu(); 
  };

  const ulClassName = `profile-dropdown ${showMenu ? '' : 'hidden'}`;

  return (
    <div className="profile-container">
      <button onClick={toggleMenu} className="profile-icon">
        <FiMenu size={24} className="menu-icon" /> 
        <FaUserCircle size={24} className="profile-icon" />
      </button>
      {showMenu && (
        <ul className={ulClassName} ref={ulRef}>
          {user ? (
            <>
              <li> Hello, {user.username}</li>
              <li>{user.firstName} {user.lastName}</li>
              <li>{user.email}</li>
              <NavLink to="/spots/current">
              <li className="manage-spots">Manage Spots</li>
              </NavLink>
              <li>
                <button className="logout-button" onClick={logout}>Log Out</button>
              </li>
            </>
          ) : (
            <>
              <OpenModalMenuItem
                itemText="Log In"
                onItemClick={closeMenu} 
                modalComponent={<LoginFormModal />}
              />
              <OpenModalMenuItem
                itemText="Sign Up"
                onItemClick={closeMenu} 
                modalComponent={<SignupFormModal />}
              />
            </>
          )}
        </ul>
      )}
    </div>
  );
}

export default ProfileButton;
