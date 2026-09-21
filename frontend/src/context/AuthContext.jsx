import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";

import { auth } from "../firebase/config";
import { fetchProfile } from "../firebase/auth";
import { AuthContext } from "./authContextObject";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        const loadedProfile = await fetchProfile(firebaseUser.uid);
        setProfile(loadedProfile);
      } else {
        setProfile(null);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    user,
    profile,
    loading,
    isAuthenticated: Boolean(user && profile),
    isAdmin: Boolean(profile?.isAdmin || profile?.isSuperAdmin),
    isSuperAdmin: Boolean(profile?.isSuperAdmin),
    refreshProfile: async () => {
      if (user) {
        const loadedProfile = await fetchProfile(user.uid);
        setProfile(loadedProfile);
      }
    },
  };

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}
