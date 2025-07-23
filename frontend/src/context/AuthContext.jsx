import { createContext, useContext, useEffect, useState } from "react";
import { auth } from "../firebaseConfig";
import {
  onAuthStateChanged,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import createApiClient from "../api/apiClient";
import { trackEvent, setUserProperties, trackConversion } from "../utils/analytics";

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [appToken, setAppToken] = useState(localStorage.getItem("appToken"));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const idToken = await firebaseUser.getIdToken();
        localStorage.setItem("appToken", idToken);
        setAppToken(idToken);

        const apiClient = createApiClient(idToken);
        try {
          const response = await apiClient.get("/users/me/");
          const backendUser = response.data;

          const combinedUser = {
            id: backendUser.id,
            email: backendUser.email,
            first_name: backendUser.first_name,
            last_name: backendUser.last_name,
            is_admin: backendUser.is_admin,
            avatar_url: backendUser.avatar_url || firebaseUser.photoURL,
            email_verified: firebaseUser.emailVerified,
            stsTokenManager: firebaseUser.stsTokenManager,
          };
          setUser(combinedUser);
          
          // Track user login and set user properties for analytics
          trackEvent('login', 'authentication', 'google', 1);
          trackConversion('signup', null, { 
            method: 'google',
            user_id: combinedUser.id,
            email: combinedUser.email 
          });
          setUserProperties(combinedUser.id, {
            plan: 'free', // Default plan
            role: backendUser.is_admin ? 'admin' : 'user',
            accountType: 'individual'
          });
        } catch (error) {
          console.error("Failed to fetch user profile, logging out:", error);
          handleLogout();
        }
      } else {
        localStorage.removeItem("appToken");
        setAppToken(null);
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      // Track login attempt
      trackEvent('login_attempt', 'authentication', 'google', 1);
      await signInWithPopup(auth, provider);
      // Login success is tracked in onAuthStateChanged
    } catch (error) {
      console.error("Error signing in with Google", error);
      // Track login failure
      trackEvent('login_failed', 'authentication', 'google', 1);
    }
  };

  const handleLogout = async () => {
    try {
      // Track logout before clearing user data
      if (user) {
        trackEvent('logout', 'authentication', 'manual', 1);
      }
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out", error);
    }
  };

  // The refreshUser function is no longer needed as the onAuthStateChanged listener handles this.

  const value = {
    user,
    appToken,
    loading,
    signInWithGoogle,
    handleLogout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
