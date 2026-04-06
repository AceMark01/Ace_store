import React, { createContext, useContext, useState, useEffect } from 'react';
import { seedDummyData } from '../utils/dummyData';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        seedDummyData();
        const storedUser = localStorage.getItem('ace_store_user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);
    }, []);

    const login = async (username, password) => {
        // HARDCODED ADMIN CHECK
        if (username === 'admin' && password === '123456') {
            const adminObj = {
                id: 'hardcoded-admin-id',
                name: 'System Admin',
                email: 'admin@acestore.com',
                role: 'admin',
                phone: '0000000000',
                avatar_url: null
            };
            setUser(adminObj);
            localStorage.setItem('ace_store_user', JSON.stringify(adminObj));
            return true;
        }

        // HARDCODED USER CHECK
        if (username === 'user' && password === '123456') {
            const userObj = {
                id: 'hardcoded-user-id',
                name: 'Test User',
                email: 'user@acestore.com',
                role: 'customer',
                phone: '1234567890',
                avatar_url: null
            };
            setUser(userObj);
            localStorage.setItem('ace_store_user', JSON.stringify(userObj));
            return true;
        }

        // Local Storage Auth (for signed up users)
        const storedUsers = JSON.parse(localStorage.getItem('ace_store_users') || '[]');
        const userData = storedUsers.find(u => u.email === username || u.phone === username);

        if (userData && userData.password === password) {
            const userObj = {
                id: userData.id,
                name: userData.name || userData.fullName,
                email: userData.email,
                role: userData.role || 'customer',
                phone: userData.phone,
                avatar_url: userData.avatar_url || null
            };

            setUser(userObj);
            localStorage.setItem('ace_store_user', JSON.stringify(userObj));
            return true;
        }

        return false;
    };

    const signup = async (userData, roleParam = 'customer') => {
        const storedUsers = JSON.parse(localStorage.getItem('ace_store_users') || '[]');
        
        if (storedUsers.find(u => u.email === userData.email)) {
            return "Email already exists";
        }

        const newUserId = Date.now().toString();
        const newUser = { 
            ...userData, 
            id: newUserId, 
            role: roleParam,
            name: userData.fullName || userData.name
        };
        
        storedUsers.push(newUser);
        localStorage.setItem('ace_store_users', JSON.stringify(storedUsers));

        const userObj = {
            id: newUserId,
            name: newUser.name,
            email: newUser.email,
            role: roleParam,
            phone: newUser.phone,
            avatar_url: null
        };

        // Auto-login
        setUser(userObj);
        localStorage.setItem('ace_store_user', JSON.stringify(userObj));

        return true;
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('ace_store_user');
    };

    const updateUser = (newData) => {
        if (!user) return;
        const updatedUser = { ...user, ...newData };
        setUser(updatedUser);
        localStorage.setItem('ace_store_user', JSON.stringify(updatedUser));
        
        // Also update in registered users list
        const storedUsers = JSON.parse(localStorage.getItem('ace_store_users') || '[]');
        const idx = storedUsers.findIndex(u => u.id === user.id);
        if (idx !== -1) {
            storedUsers[idx] = { ...storedUsers[idx], ...newData };
            localStorage.setItem('ace_store_users', JSON.stringify(storedUsers));
        }
    };

    return (
        <AuthContext.Provider value={{ user, login, signup, logout, updateUser, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
