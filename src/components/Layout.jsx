import { useState } from "react";
import { Outlet } from "react-router-dom";
import NavBar from "./NavBar";
import Modal from "./Modal";
import Authentication from "./Authentication";
import { useAuth } from "../context/AuthContext";

export default function Layout(props) {
  const [esport, setEsport] = useState();
  const [showModal, setShowModal] = useState(false);
  const { globalUser, signOutUser } = useAuth();

  const header = (
    <header className="bg-[#151515] text-white">
      {/* Top section */}
      <div className="border-b border-[#151515]">
        <div className="max-w-7xl mx-auto px-6 pt-4 flex justify-between items-center">
          {/* Left Side: Brand */}
          <div className="flex justify-between items-center gap-1">
            <img
              src="/strafeLogo.png"
              alt="strafeLogo"
              className="h-[24px] ml-2"
            />
            <h1 className="text-2xl font-bold">STRAFE</h1>
          </div>

          {/* Right Side: Login Button */}
          {globalUser ? (
            <button onClick={signOutUser}>
              <p>Logout</p>
            </button>
          ) : (
            <button
              onClick={() => {
                setShowModal(true);
              }}
            >
              <p>Login</p>
            </button>
          )}
        </div>
        <div className="mt-4 bg-[#242424]">
          <NavBar />
        </div>
      </div>
    </header>
  );

  const footer = (
    <footer className="pl-12 bg-[#151515] text-white">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <p>
          <span className="font-bold">Strafe</span> was made by{" "}
          <a
            className="text-blue-400 underline"
            target="_blank"
            href="https://www.linkedin.com/in/zi-jun-jiang/"
          >
            Zi Jun Jiang
          </a>{" "}
          using the{" "}
          <a
            className="text-blue-400 underline"
            href="https://www.fantacss.smoljames.com"
            target="_blank"
          >
            FantaCSS
          </a>{" "}
          design library.
        </p>
      </div>
    </footer>
  );
  function handleCloseModal() {
    setShowModal(false);
  }

  return (
    <>
      {showModal && (
        <Modal handleCloseModal={handleCloseModal}>
          <Authentication handleCloseModal={handleCloseModal} />
        </Modal>
      )}
      {header}
      <main className="relative bg-[#151515] text-white">
        {/* Background Image Section */}
        <div className="bg-[url('/valorant.png')] bg-top bg-center bg-no-repeat h-128 w-full" />

        {/* Content that overlaps image */}
        <div className="relative -mt-110 z-10 max-w-7xl mx-auto space-y-4">
          <Outlet />
        </div>
      </main>
      {footer}
    </>
  );
}
