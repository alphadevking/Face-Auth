import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';

export interface User {
    id: string;
    username: string;
    fullname: string;
    bio: string;
}

export interface UserData {
    message: string;
    user: User;
}

interface AuthContextType {
    user: User | null;
    logout: () => void;
    fetchUser: () => Promise<void>;
}

const SESSION_DURATION = 30 * 60 * 1000; // 30 minutes

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        const storedUserData = sessionStorage.getItem('userData');
        if (storedUserData) {
            const parsedData = JSON.parse(storedUserData);
            const currentTime = new Date().getTime();

            if (currentTime - parsedData.timestamp <= SESSION_DURATION) {
                setUser(parsedData.user);
            } else {
                sessionStorage.removeItem('userData');
            }
        }
    }, []);

    const fetchUser = async () => {
        const isValid = await validateToken();
        if (isValid) {
            const response = await axios.post<UserData>('http://localhost:8000/user-data', {}, {
                withCredentials: true
            });
            if (response.data) {
                const userDataWithTimestamp = {
                    ...response.data,
                    timestamp: new Date().getTime()
                };
                setUser(userDataWithTimestamp.user);
                sessionStorage.setItem('userData', JSON.stringify(userDataWithTimestamp));
            }
        } else {
            setUser(null);
            sessionStorage.removeItem('userData');
        }
    };

    const validateToken = async () => {
        try {
            const response = await axios.post<{ isValid: boolean }>('http://localhost:8000/validate-token', {}, {
                withCredentials: true
            });
            return response.data.isValid;
        } catch (error) {
            console.error('Error validating token', error);
            return false;
        }
    };

    const logout = async () => {
        try {
            await axios.post('http://localhost:8000/logout', {}, { withCredentials: true });
            setUser(null);
            sessionStorage.removeItem('userData');
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    return (
        <AuthContext.Provider value={{ user, logout, fetchUser }}>
            {children}
        </AuthContext.Provider>
    );
};

const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export { AuthProvider, useAuth };
