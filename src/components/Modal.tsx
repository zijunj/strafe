import { ReactNode, useEffect, useState } from "react";
import ReactDOM from "react-dom";

interface ModalProps {
  children: ReactNode;
  handleCloseModal: () => void;
}

export default function Modal({ children, handleCloseModal }: ModalProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) return null;

  const portalRoot = document.getElementById("portal");
  console.log(portalRoot);
  if (!portalRoot) return null;

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Underlay */}
      <div
        onClick={handleCloseModal}
        className="absolute inset-0 bg-black/80 z-40"
      />
      {/* Modal Content */}
      <div className="relative z-50 w-full max-w-md min-h-[500px] bg-[#242424] border border-[#303030] rounded-xl shadow-2xl p-6 flex flex-col gap-6">
        {children}
      </div>
    </div>,
    portalRoot
  );
}
