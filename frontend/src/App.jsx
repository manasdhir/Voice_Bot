import React, { useState } from "react";
import { Sidebar, SidebarBody, SidebarLink } from "../components/ui/sidebar";
import {
  IconArrowLeft,
  IconBook,
  IconBrandTabler,
  IconRobotFace,
  IconSettings,
  IconUser,
} from "@tabler/icons-react";
import { motion } from "motion/react";
import { cn } from "../lib/utils";
import Tools from "./pages/tools";
import ChatBot from "./pages/chatbot";
import KnowledgeBase from "./pages/knowledgebase";
import Profile from "./pages/profile";
import ChatbotCustomization from "./pages/customization";
import { useAuth } from "../context/authContext";

const links = [
  {
    label: "Chatbot",
    page: "chatbot",
    icon: (
      <IconRobotFace className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
    ),
  },
  {
    label: "Customization",
    page: "Customization",
    icon: (
      <IconBrandTabler className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
    ),
  },
  {
    label: "Knowledge Base",
    page: "knowledgebase",
    icon: (
      <IconBook className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
    ),
  },
];

const Logo = () => {
  return (
    <a
      href="#"
      className="relative z-20 flex items-center space-x-2 py-1 text-sm font-normal text-black"
    >
      <img src="./logowhite.svg" className="h-7 w-7 shrink-0" alt="Logo" />
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="font-medium whitespace-pre text-black dark:text-white"
      >
        Voice Bot
      </motion.span>
    </a>
  );
};

const LogoIcon = () => {
  return (
    <a
      href="#"
      className="relative z-20 flex items-center space-x-2 py-1 text-sm font-normal text-black"
    >
      <img src="./logowhite.svg" className="h-7 w-7 shrink-0" alt="Logo" />
    </a>
  );
};

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

const UserAvatar = ({ user, size = "h-7 w-7" }) => {
  const initials = getUserInitials(user);

  return (
    <div
      className={`${size} shrink-0 rounded-full bg-orange-500 flex items-center justify-center text-white font-semibold text-sm border-2 border-transparent hover:border-orange-400 transition-colors shadow-sm`}
    >
      {initials}
    </div>
  );
};

const UserProfile = ({ user, isSignedIn, loading, open, onClick }) => {
  if (loading) {
    return (
      <div className="flex items-center space-x-2 py-2 px-2 rounded-md">
        <div className="h-7 w-7 rounded-full bg-neutral-300 dark:bg-neutral-600 animate-pulse"></div>
        {open && (
          <div className="h-4 w-20 bg-neutral-300 dark:bg-neutral-600 rounded animate-pulse"></div>
        )}
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <SidebarLink
        link={{
          label: "Sign In",
          page: "profile",
          icon: (
            <div className="h-7 w-7 shrink-0 rounded-full bg-neutral-300 dark:bg-neutral-600 flex items-center justify-center">
              <IconUser className="h-4 w-4 text-neutral-600 dark:text-neutral-300" />
            </div>
          ),
        }}
        onClick={onClick}
      />
    );
  }

  return (
    <SidebarLink
      link={{
        label: user?.name || "Profile",
        page: "profile",
        icon: <UserAvatar user={user} />,
      }}
      onClick={onClick}
    />
  );
};

const App = () => {
  const [open, setOpen] = useState(false);
  const [selectedPage, setSelectedPage] = useState("chatbot");
  const { user, isSignedIn, loading } = useAuth();

  let PageComponent = null;
  if (selectedPage === "Customization") PageComponent = ChatbotCustomization;
  else if (selectedPage === "chatbot") PageComponent = ChatBot;
  else if (selectedPage === "knowledgebase") PageComponent = KnowledgeBase;
  else if (selectedPage === "profile") PageComponent = Profile;

  return (
    <div
      className={cn(
        "mx-auto flex w-screen h-screen max-w-none flex-1 flex-col overflow-hidden rounded-none border border-neutral-200 bg-gray-100 md:flex-row dark:border-neutral-700 dark:bg-neutral-800",
      )}
    >
      <Sidebar open={open} setOpen={setOpen}>
        <SidebarBody className="justify-between gap-10">
          <div className="flex flex-1 flex-col overflow-x-hidden overflow-y-auto">
            {open ? <Logo /> : <LogoIcon />}
            <div className="mt-8 flex flex-col gap-2">
              {links.map((link, idx) => (
                <SidebarLink
                  key={idx}
                  link={link}
                  onClick={() => {
                    if (link.page === "logout") return; // handle logout separately if needed
                    setSelectedPage(link.page);
                  }}
                />
              ))}
            </div>
          </div>

          {/* User Profile Section */}
          <div className="border-t border-neutral-200 dark:border-neutral-700 pt-4">
            {isSignedIn && user && open && (
              <div className="px-2 py-2 mb-2">
                <div className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">
                  Signed in as
                </div>
                <div className="text-sm font-medium text-neutral-700 dark:text-neutral-200 truncate">
                  {user.email}
                </div>
              </div>
            )}
            <UserProfile
              user={user}
              isSignedIn={isSignedIn}
              loading={loading}
              open={open}
              onClick={() => setSelectedPage("profile")}
            />
          </div>
        </SidebarBody>
      </Sidebar>
      {PageComponent && <PageComponent />}
    </div>
  );
};

export default App;
