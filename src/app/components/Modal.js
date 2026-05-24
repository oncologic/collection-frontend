"use client";

import { useState, useRef, useEffect } from "react";
import { Dialog, DialogBackdrop, DialogPanel } from "@headlessui/react";
import { FaTimes } from "react-icons/fa";

const Modal = ({
  children,
  isOpen = true,
  onClose,
  maxWidth = "max-w-4xl",
  className = "",
  customClass = "",
  closeOnOutsideClick = true,
  showCloseButton = true,
}) => {
  return (
    <Dialog
      open={isOpen}
      onClose={() => closeOnOutsideClick && onClose()}
      className="relative z-50"
    >
      {/* Background overlay */}
      <DialogBackdrop
        className="fixed inset-0 bg-black/30 sm:backdrop-blur-sm"
        aria-hidden="true"
      />

      {/* Full-screen scrollable container */}
      <div className="fixed inset-0 overflow-y-auto z-50">
        {/* Container to center the panel */}
        <div className="flex min-h-full items-center justify-center p-2 sm:p-4">
          <DialogPanel
            className={`${customClass || maxWidth} relative w-full transform rounded-lg bg-white shadow-xl transition-all ${className}`}
          >
            {showCloseButton && (
              <button
                onClick={onClose}
                className="absolute top-2 right-2 sm:top-4 sm:right-4 text-gray-400 hover:text-gray-600 z-10"
              >
                <FaTimes size={20} className="sm:w-6 sm:h-6" />
              </button>
            )}

            {/* Wrapper to constrain height and show scrollbars if necessary */}
            <div className="max-h-[90vh] overflow-y-auto rounded-md">{children}</div>
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  );
};

export default Modal;
