'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

// Định nghĩa các kiểu dữ liệu cho Auth
interface AuthContextType {
  userName: string;
  isLoggedIn: boolean;
  login: (name: string) => void;
  logout: () => void;
}

// Tạo Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [userName, setUserName] = useState<string>('');
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);

  // Khi app load, kiểm tra xem người dùng đã từng nhập tên chưa (lưu ở máy local)
  useEffect(() => {
    const savedName = localStorage.getItem('ecoscan_user');
    if (savedName) {
      setUserName(savedName);
      setIsLoggedIn(true);
    }
  }, []);

  const login = (name: string) => {
    if (name.trim()) {
      setUserName(name);
      setIsLoggedIn(true);
      localStorage.setItem('ecoscan_user', name);
    }
  };

  const logout = () => {
    setUserName('');
    setIsLoggedIn(false);
    localStorage.removeItem('ecoscan_user');
  };

  return (
    <AuthContext.Provider value={{ userName, isLoggedIn, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook để các file khác gọi dữ liệu
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
