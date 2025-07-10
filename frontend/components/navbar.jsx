import React from "react";

const NavBar = () => {
  return (
    <div className="w-full  bg-transparent flex justify-center items-center fixed top-0 z-50">
      <nav className="flex justify-between items-center p-4 w-[90%] bg-white/20 my-2 rounded-full backdrop-blur-3xl">
        <div className="text-white text-lg font-bold flex items-center justify-center gap-2 ml-4">
          <img src="/logo.svg" alt="Logo" className="h-10 w-10 rounded-full" />
          <span>Voice Bot</span>
        </div>
        <div className="flex justify-between items-center">
          <ul className="flex space-x-4">
            <li className="text-gray-200 hover:text-blue-500 cursor-pointer">
              Home
            </li>
            <li className="text-gray-200 hover:text-blue-500 cursor-pointer">
              About
            </li>
            <li className="text-gray-200 hover:text-blue-500 cursor-pointer">
              Contact
            </li>
          </ul>
        </div>
      </nav>
    </div>
  );
};

export default NavBar;
