"use client";

import NavBar from "@/components/NavBar";
import Modal from "@/components/Modal";
import Authentication from "@/components/Authentication";
import { useAuth } from "@/context/AuthContext";
import { useState } from "react";

export default function LayoutShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const [showModal, setShowModal] = useState(false);
  const { globalUser, globalData, signOutUser } = useAuth();

  const handleCloseModal = () => setShowModal(false);

  return (
    <>
      {showModal && (
        <Modal handleCloseModal={handleCloseModal}>
          <Authentication handleCloseModal={handleCloseModal} />
        </Modal>
      )}

      <header className="bg-[#151515] text-white border-b border-[#151515]">
        <div className="max-w-7xl mx-auto px-6 pt-4 flex justify-between items-center">
          {/* Left Logo */}
          <div className="flex items-center gap-1">
            <img
              src="/strafeLogo.png"
              alt="strafeLogo"
              className="h-[24px] ml-2"
            />
            <h1 className="text-2xl font-bold">STRAFE</h1>
          </div>

          {/* Right User Section */}
          {globalUser ? (
            <div className="relative group inline-block">
              {/* Trigger */}
              <div className="flex items-center gap-2 cursor-pointer">
                <div className="flex flex-col text-right">
                  <span className="text-yellow-300 font-bold">
                    {globalData?.username || "User"}
                  </span>
                  <span className="text-gray-400 text-xs">
                    @{globalData?.username || globalUser.email?.split("@")[0]}
                  </span>
                </div>
                <img
                  src="/default-avatar.png"
                  alt="avatar"
                  className="w-8 h-8 rounded-full"
                />
              </div>

              {/* Dropdown (stays visible while hovering over trigger OR itself) */}
              <div className="absolute right-0 mt-2 w-40 bg-[#242424] text-center border border-[#303030] rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-50">
                <ul className="text-sm">
                  <li className="px-4 py-2 text-white hover:bg-[#2a2a2a] cursor-pointer">
                    Profile
                  </li>
                  <li
                    className="px-4 py-2 bg-[#e4ef43] text-black font-semibold hover:bg-[#151515] border hover:border-[#e4ef43] hover:text-[#e4ef43]
             transition-colors duration-200"
                    onClick={signOutUser}
                  >
                    Sign Out
                  </li>
                </ul>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowModal(true)}
              className="px-6 py-2 rounded-lg font-bold uppercase 
             bg-[#151515] text-[#e4ef43] border border-[#e4ef43] 
             hover:bg-[#e4ef43] hover:text-black 
             transition-colors duration-200"
            >
              Log In
            </button>
          )}
        </div>

        {/* NavBar below */}
        <div className="mt-4 bg-[#242424]">
          <NavBar />
        </div>
      </header>

      <main>
        <div className="bg-[url('/valorant.png')] bg-top bg-center bg-no-repeat h-128 w-full" />
        <div className="relative -mt-110 z-10 max-w-7xl mx-auto space-y-4">
          {children}
        </div>
      </main>

      <footer className="pl-12 bg-[#151515] text-white">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <p>
            <span className="font-bold">Strafe</span> was made by{" "}
            <a
              className="text-blue-400 underline"
              target="_blank"
              href="https://www.linkedin.com/in/zi-jun-jiang/"
              rel="noopener noreferrer"
            >
              Zi Jun Jiang
            </a>{" "}
            using the{" "}
            <a
              className="text-blue-400 underline"
              href="https://www.fantacss.smoljames.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              FantaCSS
            </a>{" "}
            design library.
          </p>
        </div>
      </footer>
    </>
  );
}
