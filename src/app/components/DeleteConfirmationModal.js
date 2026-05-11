import React from "react";
import Modal from "./Modal";

function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  confirmDisabled = false,
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-6">
          <h2 className="text-xl font-bold mb-4 text-gray-700">{title}</h2>
          <p className="mb-6 text-gray-600">{message}</p>
          <div className="flex justify-end space-x-4">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 rounded-lg text-gray-700 hover:bg-gray-300 transition-colors"
            >
              {cancelLabel}
            </button>
            <button
              onClick={onConfirm}
              disabled={confirmDisabled}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:bg-red-300 disabled:cursor-not-allowed transition-colors"
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </Modal>
  );
}

export default DeleteConfirmationModal;
