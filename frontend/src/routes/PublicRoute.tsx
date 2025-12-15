import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { isAuthenticated } from '../utils/auth';

interface PublicRouteProps {
  children: React.ReactNode;
}

const PublicRoute: React. FC<PublicRouteProps> = ({ children }) => {
  const location = useLocation();

  if (isAuthenticated()) {
    const from = (location.state as { from?:  Location })?.from?.pathname || '/tasks';
    return <Navigate to={from} replace />;
  }

  return <>{children}</>;
};

export default PublicRoute;