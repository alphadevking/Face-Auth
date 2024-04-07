import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
    element: React.ReactElement;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ element }) => {
    const { fetchUser, user } = useAuth();
    const [loading, setLoading] = useState<boolean>(true); // Initialize a loading state

    useEffect(() => {
        // Fetch the user and once it's done, set loading to false
        fetchUser().then(() => {
            setLoading(false);
        }).catch(() => {
            setLoading(false);
        });
    }, [fetchUser]);

    // While loading, you might want to render nothing or a loading spinner
    if (loading) {
        return <div>Loading...</div>; // Or any other loading indicator
    }

    // After loading, navigate based on the user state
    return user ? element : <Navigate to="/login" />;
};

export default ProtectedRoute;
