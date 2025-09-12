"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { supabase } from "../app/supabaseClient";
import { Session, User } from "@supabase/supabase-js";

// Define your user data type from your "users" table
type GlobalData = {
  id: string;
  // Add other fields from your Supabase `users` table here
  [key: string]: any;
};

// Define context value type
interface AuthContextType {
  globalUser: User | null;
  globalData: GlobalData | null;
  setGlobalData: (data: GlobalData | null) => void;
  isLoading: boolean;
  signUpNewUser: (email: string, password: string) => Promise<AuthResult>;
  signInUser: (email: string, password: string) => Promise<AuthResult>;
  signOutUser: () => Promise<void>;
}

// Define the return type for auth functions
interface AuthResult {
  success: boolean;
  data?: any;
  error?: string;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Context Provider
export const AuthContextProvider = ({ children }: { children: ReactNode }) => {
  const [globalUser, setGlobalUser] = useState<User | null>(null);
  const [globalData, setGlobalData] = useState<GlobalData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Sign Up
  const signUpNewUser = async (
    email: string,
    password: string
  ): Promise<AuthResult> => {
    const { data, error } = await supabase.auth.signUp({
      email: email.toLowerCase(),
      password,
    });

    if (error) {
      console.error("Error signing up:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  };

  // Sign In
  const signInUser = async (
    email: string,
    password: string
  ): Promise<AuthResult> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase(),
        password,
      });

      if (error) {
        console.error("Sign-in error:", error.message);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (err: any) {
      console.error("Unexpected error during sign-in:", err.message);
      return {
        success: false,
        error: "An unexpected error occurred. Please try again.",
      };
    }
  };

  // Sign Out
  const signOutUser = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error signing out:", error);
    } else {
      setGlobalUser(null);
      setGlobalData(null);
    }
  };

  // Load user session + user data
  useEffect(() => {
    const loadSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        setGlobalUser(session.user);
        fetchUserData(session.user.id);
      } else {
        setGlobalUser(null);
        setGlobalData(null);
      }
    };

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session?.user) {
          setGlobalUser(session.user);
          fetchUserData(session.user.id);
        } else {
          setGlobalUser(null);
          setGlobalData(null);
        }
      }
    );

    loadSession();

    return () => {
      authListener.subscription?.unsubscribe();
    };
  }, []);

  // Fetch user info from "users" table
  const fetchUserData = async (userId: string) => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Failed to fetch user data:", error.message);
      setGlobalData(null);
    } else {
      setGlobalData(data);
    }

    setIsLoading(false);
  };

  return (
    <AuthContext.Provider
      value={{
        globalUser,
        globalData,
        setGlobalData,
        isLoading,
        signUpNewUser,
        signInUser,
        signOutUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Hook for easier access
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthContextProvider");
  }
  return context;
};
