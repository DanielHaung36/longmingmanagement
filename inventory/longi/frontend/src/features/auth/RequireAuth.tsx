import React from 'react';
import { useLocation, Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useVerifyQuery } from './authApi';
import type { RootState } from '../../app/store';

const RequireAuth: React.FC = () => {
    const location = useLocation();
    const user = useSelector((state: RootState) => state.auth.user);

    // Verify session cookie (skip if user already loaded)
    const { isLoading, isError } = useVerifyQuery(undefined, {
        skip: Boolean(user),
    });

    if (isLoading) {
        return <div>Loading...</div>;
    }
    if (!user || isError) {
        // Redirect to login page, which will auto-redirect to SSO
        return <Navigate to="/login" state={{ from: location }} replace />;
    }
    return <Outlet />;
};
export default RequireAuth;
