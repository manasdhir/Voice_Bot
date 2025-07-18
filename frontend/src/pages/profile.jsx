import React, { useState } from "react";
import { useAuth } from "../../context/authContext";

// Function to get user's initials
const getUserInitials = (user) => {
  if (!user) return "?";

  if (user.name) {
    // Get first letter of first name and last name
    const nameParts = user.name.trim().split(" ");
    if (nameParts.length >= 2) {
      return (
        nameParts[0][0] + nameParts[nameParts.length - 1][0]
      ).toUpperCase();
    }
    return nameParts[0][0].toUpperCase();
  }

  // Fall back to first letter of email
  if (user.email) {
    return user.email[0].toUpperCase();
  }

  return "?";
};

const UserAvatar = ({ user, size = "w-24 h-24" }) => {
  const initials = getUserInitials(user);

  return (
    <div
      className={`${size} shrink-0 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold text-3xl border-4 border-orange-400 shadow-lg`}
    >
      {initials}
    </div>
  );
};

const Profile = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const { user, isSignedIn, loading, signInOrCreateUser, signOut } = useAuth();

  const handleSignInOrCreateUser = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      alert("Please enter both email and password");
      return;
    }

    setActionLoading(true);

    const result = await signInOrCreateUser(email, password);

    if (result.success) {
      if (!result.requiresConfirmation) {
        setEmail("");
        setPassword("");
      }
      alert(result.message);
    } else {
      alert("Error: " + result.message);
    }

    setActionLoading(false);
  };

  const handleSignOut = async () => {
    setActionLoading(true);
    const result = await signOut();
    alert(result.message);
    setActionLoading(false);
  };

  if (loading) {
    return (
      <div className="bg-gray-100 dark:bg-black w-full h-full rounded-l-2xl flex flex-col items-center justify-center text-neutral-700 dark:text-white p-8">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="bg-gray-100 dark:bg-black w-full h-full rounded-l-2xl flex flex-col items-center text-neutral-700 dark:text-white p-8 overflow-auto">
      <h1 className="text-3xl font-bold mb-6 w-full text-left text-black dark:text-white">
        Profile
      </h1>
      {isSignedIn && user ? (
        <div className="flex flex-col items-center gap-4 bg-white/10 dark:bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-xl border border-neutral-200 dark:border-white/20 w-full max-w-md">
          <UserAvatar user={user} />
          <h2 className="text-2xl font-bold text-orange-400">{user.name}</h2>
          <p className="text-neutral-600 dark:text-neutral-300">{user.email}</p>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm">
            {user.role}
          </p>
          <div className="mt-4 text-center text-neutral-600 dark:text-neutral-300">
            <p>
              Welcome, {user.name}! Here you can view and edit your profile
              information. More features coming soon.
            </p>
          </div>
          <button
            onClick={handleSignOut}
            disabled={actionLoading}
            className="mt-4 bg-red-500/80 hover:bg-red-600/80 text-white rounded-xl px-4 py-2 font-semibold shadow-md backdrop-blur-md transition-all border border-red-400 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {actionLoading ? "Signing out..." : "Sign Out"}
          </button>
        </div>
      ) : (
        <div className="bg-white/10 dark:bg-white/10 backdrop-blur-lg rounded-2xl p-8 flex flex-col items-center w-full max-w-md border border-neutral-200 dark:border-white/20 shadow-xl">
          <h2 className="text-xl font-bold mb-4 text-orange-400">Sign In</h2>
          <form
            className="flex flex-col gap-4 w-full"
            onSubmit={handleSignInOrCreateUser}
          >
            <input
              type="email"
              placeholder="Email"
              className="px-4 py-2 rounded-lg bg-white/20 dark:bg-white/20 text-black dark:text-white border border-neutral-200 dark:border-white/20 focus:outline-none focus:ring-2 focus:ring-orange-400 placeholder:text-neutral-500 dark:placeholder:text-neutral-300"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={actionLoading}
            />
            <input
              type="password"
              placeholder="Password"
              className="px-4 py-2 rounded-lg bg-white/20 dark:bg-white/20 text-black dark:text-white border border-neutral-200 dark:border-white/20 focus:outline-none focus:ring-2 focus:ring-orange-400 placeholder:text-neutral-500 dark:placeholder:text-neutral-300"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={actionLoading}
            />
            <button
              type="submit"
              className="bg-orange-500/80 hover:bg-orange-600/80 text-white rounded-xl px-4 py-2 font-semibold shadow-md backdrop-blur-md transition-all border border-orange-400 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={actionLoading}
            >
              {actionLoading ? "Processing..." : "Sign In / Create Account"}
            </button>
          </form>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm mt-4 text-center">
            Don't have an account? No worries! We'll create one for you
            automatically.
          </p>
        </div>
      )}
    </div>
  );
};

export default Profile;
