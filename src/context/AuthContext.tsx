"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { supabase } from "../app/supabaseClient";
import { User } from "@supabase/supabase-js";

type GlobalData = {
  id: string;
  username?: string;
  email?: string;
  [key: string]: any;
};

interface AuthContextType {
  globalUser: User | null;
  globalData: GlobalData | null;
  setGlobalData: (data: GlobalData | null) => void;
  isLoading: boolean;
  signUpNewUser: (email: string, password: string) => Promise<AuthResult>;
  signInUser: (email: string, password: string) => Promise<AuthResult>;
  signOutUser: () => Promise<void>;
}

interface AuthResult {
  success: boolean;
  data?: any;
  error?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const buildFallbackProfile = (user: User): GlobalData => ({
  id: user.id,
  email: user.email,
  username:
    typeof user.user_metadata?.username === "string" &&
    user.user_metadata.username.trim()
      ? user.user_metadata.username.trim()
      : user.email?.split("@")[0] || "User",
});

export const AuthContextProvider = ({ children }: { children: ReactNode }) => {
  const [globalUser, setGlobalUser] = useState<User | null>(null);
  const [globalData, setGlobalData] = useState<GlobalData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const signUpNewUser = async (
    email: string,
    password: string,
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

  const signInUser = async (
    email: string,
    password: string,
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

  const signOutUser = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error signing out:", error);
    } else {
      setGlobalUser(null);
      setGlobalData(null);
    }
  };

  useEffect(() => {
    const loadSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        setGlobalUser(session.user);
        setGlobalData(buildFallbackProfile(session.user));
        fetchUserData(session.user);
      } else {
        setGlobalUser(null);
        setGlobalData(null);
      }
    };

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session?.user) {
          setGlobalUser(session.user);
          setGlobalData(buildFallbackProfile(session.user));
          fetchUserData(session.user);
        } else {
          setGlobalUser(null);
          setGlobalData(null);
        }
      },
    );

    loadSession();

    return () => {
      authListener.subscription?.unsubscribe();
    };
  }, []);

  const fetchUserData = async (user: User) => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      console.error("Failed to fetch user data:", error.message);
      setGlobalData(buildFallbackProfile(user));
    } else if (data) {
      setGlobalData({ ...buildFallbackProfile(user), ...data });
    } else {
      setGlobalData(buildFallbackProfile(user));
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

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthContextProvider");
  }
  return context;
};
