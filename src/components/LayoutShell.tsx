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
  const { globalUser, signOutUser } = useAuth();

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
          <div className="flex items-center gap-1">
            <img
              src="/strafeLogo.png"
              alt="strafeLogo"
              className="h-[24px] ml-2"
            />
            <h1 className="text-2xl font-bold">STRAFE</h1>
          </div>

          {globalUser ? (
            <button onClick={signOutUser}>
              <p>Logout</p>
            </button>
          ) : (
            <button onClick={() => setShowModal(true)}>
              <p>Login</p>
            </button>
          )}
        </div>

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
