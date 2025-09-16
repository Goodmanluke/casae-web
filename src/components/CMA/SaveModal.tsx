interface SaveModalProps {
  showModal: boolean;
  onClose: () => void;
  modalType: "success" | "error" | "login";
  message: string;
}

export default function SaveModal({ showModal, onClose, modalType, message }: SaveModalProps) {
  if (!showModal) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
        <div className="text-center">
          <div className="mb-4">
            {modalType === "success" && (
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  ></path>
                </svg>
              </div>
            )}
            {modalType === "error" && (
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  ></path>
                </svg>
              </div>
            )}
            {modalType === "login" && (
              <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  ></path>
                </svg>
              </div>
            )}
          </div>

          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {modalType === "success" && "Property Saved!"}
            {modalType === "error" && "Save Failed"}
            {modalType === "login" && "Login Required"}
          </h3>

          <p className="text-gray-600 mb-6">{message}</p>

          <div className="flex gap-3 justify-center">
            {modalType === "login" ? (
              <>
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    onClose();
                    window.location.href = "/login";
                  }}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
                >
                  Go to Login
                </button>
              </>
            ) : (
              <button
                onClick={onClose}
                className={`px-6 py-2 rounded-lg transition ${
                  modalType === "success"
                    ? "bg-green-600 hover:bg-green-700 text-white"
                    : "bg-red-600 hover:bg-red-700 text-white"
                }`}
              >
                {modalType === "success" ? "Great!" : "OK"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
