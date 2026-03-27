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

      <header className="shell-fade-in bg-[#151515]/90 text-white border-b border-[#151515] backdrop-blur-xl">
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
        <div className="mt-4 bg-[#242424]/95">
          <NavBar />
        </div>
      </header>

      <main>
        <div className="hero-reveal relative h-128 w-full overflow-hidden">
          <div className="absolute inset-0 bg-[url('/valorant.png')] bg-top bg-center bg-no-repeat" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/35 to-[#111111]" />
        </div>
        <div className="content-rise stagger-1 relative -mt-110 z-10 max-w-7xl mx-auto space-y-4">
          {children}
        </div>
      </main>

      <footer className="shell-fade-in stagger-2 bg-[#111111] text-white border-t border-[#232323] mt-16">
        <div className="max-w-7xl mx-auto px-6 py-14">
          <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
            <div>
              <div className="flex items-center gap-3">
                <img
                  src="/strafeLogo.png"
                  alt="Strafe logo"
                  className="h-10 w-10 object-contain"
                />
                <div>
                  <p className="text-xl font-extrabold tracking-[0.12em] text-white">
                    STRAFE
                  </p>
                  <p className="mt-1 text-sm text-[#7f7f7f]">
                    Everything esports, all in one place.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <p className="text-sm font-extrabold uppercase tracking-[0.12em] text-white">
                Creator
              </p>
              <p className="mt-4 text-lg font-semibold text-[#f2f2f2]">
                Zi Jun Jiang
              </p>
              <p className="mt-2 text-sm leading-6 text-[#7f7f7f]">
                Designer and developer behind the Strafe experience.
              </p>
            </div>

            <div>
              <p className="text-sm font-extrabold uppercase tracking-[0.12em] text-white">
                Socials
              </p>
              <div className="mt-4 flex flex-wrap gap-4">
                <a
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#363636] text-[#e4ef43] transition-colors hover:border-[#e4ef43] hover:text-white"
                  target="_blank"
                  href="https://www.linkedin.com/in/zi-jun-jiang/"
                  rel="noopener noreferrer"
                  aria-label="LinkedIn"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    className="h-5 w-5 fill-current"
                    aria-hidden="true"
                  >
                    <path d="M4.98 3.5C4.98 4.88 3.87 6 2.49 6S0 4.88 0 3.5 1.11 1 2.49 1s2.49 1.12 2.49 2.5ZM.5 8h4V23h-4V8Zm7 0h3.83v2.05h.05c.53-1.01 1.84-2.08 3.79-2.08 4.05 0 4.8 2.66 4.8 6.12V23h-4v-7.84c0-1.87-.03-4.27-2.6-4.27-2.6 0-3 2.03-3 4.13V23h-4V8Z" />
                  </svg>
                </a>
                <a
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#363636] text-[#e4ef43] transition-colors hover:border-[#e4ef43] hover:text-white"
                  target="_blank"
                  href="https://github.com/zijunj"
                  rel="noopener noreferrer"
                  aria-label="GitHub"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    className="h-5 w-5 fill-current"
                    aria-hidden="true"
                  >
                    <path d="M12 .5C5.65.5.5 5.66.5 12.03c0 5.09 3.29 9.4 7.86 10.92.58.11.79-.25.79-.56 0-.28-.01-1.02-.02-2-3.2.7-3.88-1.54-3.88-1.54-.52-1.33-1.28-1.68-1.28-1.68-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.2 1.77 1.2 1.04 1.78 2.72 1.27 3.38.97.1-.75.4-1.27.73-1.56-2.56-.29-5.26-1.29-5.26-5.74 0-1.27.45-2.3 1.19-3.11-.12-.29-.52-1.46.11-3.04 0 0 .97-.31 3.19 1.19a11.05 11.05 0 0 1 5.8 0c2.21-1.5 3.18-1.19 3.18-1.19.64 1.58.24 2.75.12 3.04.74.81 1.19 1.84 1.19 3.11 0 4.46-2.7 5.44-5.28 5.73.42.36.78 1.08.78 2.17 0 1.57-.01 2.84-.01 3.22 0 .31.21.68.8.56A11.54 11.54 0 0 0 23.5 12.03C23.5 5.66 18.35.5 12 .5Z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
