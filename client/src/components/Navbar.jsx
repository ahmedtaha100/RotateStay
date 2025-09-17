import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';

const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <header className="bg-dark-800/80 backdrop-blur border-b border-dark-600">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link to="/" className="text-xl font-semibold text-white">
          RotateStay
        </Link>
        <nav className="hidden gap-6 text-sm font-medium text-gray-300 md:flex">
          <NavLink to="/" className={({ isActive }) => navClasses(isActive)} end>
            Home
          </NavLink>
          <NavLink to="/listings" className={({ isActive }) => navClasses(isActive)}>
            Listings
          </NavLink>
          {user && (
            <>
              <NavLink to="/dashboard" className={({ isActive }) => navClasses(isActive)}>
                Dashboard
              </NavLink>
              <NavLink to="/messages" className={({ isActive }) => navClasses(isActive)}>
                Messages
              </NavLink>
            </>
          )}
        </nav>
        <div className="flex items-center gap-4 text-sm font-medium">
          {user ? (
            <>
              <span className="hidden text-gray-300 md:inline">
                {user.firstName} {user.lastName}
              </span>
              <button
                onClick={logout}
                className="rounded-full border border-primary-500 px-4 py-2 text-primary-400 transition hover:bg-primary-500/10"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="rounded-full border border-primary-500 px-4 py-2 text-primary-400 transition hover:bg-primary-500/10"
              >
                Log in
              </Link>
              <Link
                to="/register"
                className="rounded-full bg-gradient-primary px-4 py-2 text-white shadow hover:shadow-lg"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

const navClasses = (isActive) =>
  `transition hover:text-white ${isActive ? 'text-white' : ''}`;

export default Navbar;
