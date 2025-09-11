import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

const AuthContext = createContext();

export const AuthContextProvider = ({ children }) => {
  const [globalUser, setGlobalUser] = useState(null);
  const [globalData, setGlobalData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Sign Up
  const signUpNewUser = async (email, password) => {
    const { data, error } = await supabase.auth.signUp({
      email: email.toLowerCase(),
      password: password,
    });

    if (error) {
      console.error("Error signing up:", error);
      return { success: false, error };
    }

    return { success: true, data };
  };

  // Sign In
  const signInUser = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase(),
        password: password,
      });

      if (error) {
        console.error("Sign-in error:", error.message);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (err) {
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

    // Listen for auth state changes
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

  // Fetch custom user data (replace "users" with your actual table name)
  const fetchUserData = async (userId) => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("users") // ⚠️ Ensure this table exists and has a `id` column matching Supabase user ID
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

export const useAuth = () => {
  return useContext(AuthContext);
};
