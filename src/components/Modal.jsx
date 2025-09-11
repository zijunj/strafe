import ReactDom from "react-dom";

export default function Modal(props) {
  const { children, handleCloseModal } = props;
  return ReactDom.createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Underlay (semi-transparent dark background) */}
      <div
        onClick={handleCloseModal}
        className="absolute inset-0 bg-black/80 z-40"
      />

      {/* Modal Content */}
      <div className="relative z-50 w-full max-w-md min-h-[500px] bg-[#242424] border border-[#303030] rounded-xl shadow-2xl p-6 flex flex-col gap-6">
        {children}
      </div>
    </div>,
    document.getElementById("portal")
  );
}
