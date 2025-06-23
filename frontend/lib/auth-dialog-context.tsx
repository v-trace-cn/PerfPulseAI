"use client";

import { createContext, useContext, useState, ReactNode } from 'react';

type AuthDialogContextType = {
  authDialogOpen: boolean;
  authMode: "login" | "register" | "reset";
  setAuthDialogOpen: (open: boolean) => void;
  setAuthMode: (mode: "login" | "register" | "reset") => void;
  openLoginDialog: () => void;
  openRegisterDialog: () => void;
  openResetPasswordDialog: () => void;
};

const AuthDialogContext = createContext<AuthDialogContextType | undefined>(undefined);

export function AuthDialogProvider({ children }: { children: ReactNode }) {
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register" | "reset">("login");

  const openLoginDialog = () => {
    setAuthMode("login");
    setAuthDialogOpen(true);
  };

  const openRegisterDialog = () => {
    setAuthMode("register");
    setAuthDialogOpen(true);
  };

  const openResetPasswordDialog = () => {
    setAuthMode("reset");
    setAuthDialogOpen(true);
  };

  return (
    <AuthDialogContext.Provider
      value={{
        authDialogOpen,
        authMode,
        setAuthDialogOpen,
        setAuthMode,
        openLoginDialog,
        openRegisterDialog,
        openResetPasswordDialog,
      }}
    >
      {children}
    </AuthDialogContext.Provider>
  );
}

export function useAuthDialog() {
  const context = useContext(AuthDialogContext);
  if (context === undefined) {
    throw new Error('useAuthDialog must be used within an AuthDialogProvider');
  }
  return context;
} 