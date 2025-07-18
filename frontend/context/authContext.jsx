import React, { createContext, useState, useContext, useEffect } from "react";
import { supabase } from "../lib/supabase";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSignedIn, setIsSignedIn] = useState(false);

  // Check if user is already signed in on app start
  useEffect(() => {
    const checkUser = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          setIsSignedIn(true);
          setUser({
            id: user.id,
            name:
              user.user_metadata?.name || user.email?.split("@")[0] || "User",
            email: user.email,
            avatar: user.user_metadata?.avatar_url || "./manas.png",
            role: "User",
            raw: user, // Keep raw user data for advanced use cases
          });
        }
      } catch (error) {
        console.error("Error checking user:", error);
      } finally {
        setLoading(false);
      }
    };

    checkUser();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN") {
        const user = session?.user;
        if (user) {
          setIsSignedIn(true);
          setUser({
            id: user.id,
            name:
              user.user_metadata?.name || user.email?.split("@")[0] || "User",
            email: user.email,
            avatar: user.user_metadata?.avatar_url || "./manas.png",
            role: "User",
            raw: user,
          });
        }
      } else if (event === "SIGNED_OUT") {
        setIsSignedIn(false);
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInOrCreateUser = async (email, password) => {
    try {
      setLoading(true);

      // First, try to sign in with existing credentials
      const { data: signInData, error: signInError } =
        await supabase.auth.signInWithPassword({
          email: email,
          password: password,
        });

      if (signInData.user) {
        // User exists and signed in successfully
        console.log("User signed in successfully");
        return { success: true, message: "Signed in successfully!" };
      }

      // If sign in failed, check if it's because user doesn't exist
      if (signInError) {
        console.log(
          "Sign in failed, attempting to create account:",
          signInError.message
        );

        // Try to create a new account
        const { data: signUpData, error: signUpError } =
          await supabase.auth.signUp({
            email: email,
            password: password,
            options: {
              data: {
                name: email.split("@")[0], // Use email prefix as default name
              },
            },
          });

        if (signUpError) {
          console.error("Error creating account:", signUpError.message);
          return { success: false, message: signUpError.message };
        }

        if (signUpData.user) {
          // Account created successfully
          console.log("Account created successfully");

          // Check if email confirmation is required
          if (signUpData.user.email_confirmed_at) {
            // Email already confirmed, user is signed in
            return {
              success: true,
              message: "Account created and signed in successfully!",
            };
          } else {
            // Email confirmation required
            return {
              success: true,
              message:
                "Account created! Please check your email to confirm your account, then try signing in again.",
              requiresConfirmation: true,
            };
          }
        }
      }
    } catch (error) {
      console.error("Unexpected error:", error);
      return {
        success: false,
        message: "An unexpected error occurred. Please try again.",
      };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Error signing out:", error.message);
        return { success: false, message: error.message };
      }
      return { success: true, message: "Signed out successfully!" };
    } catch (error) {
      console.error("Error signing out:", error);
      return { success: false, message: "An unexpected error occurred." };
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.updateUser({
        data: updates,
      });

      if (error) {
        return { success: false, message: error.message };
      }

      return { success: true, message: "Profile updated successfully!" };
    } catch (error) {
      console.error("Error updating profile:", error);
      return { success: false, message: "An unexpected error occurred." };
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    isSignedIn,
    loading,
    signInOrCreateUser,
    signOut,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
