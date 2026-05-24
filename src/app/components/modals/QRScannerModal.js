"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Modal from "../Modal";

const QRScannerModal = ({ isOpen, onClose, onScan }) => {
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState(null);
  const scannerRef = useRef(null);
  const html5QrCodeRef = useRef(null);

  const stopScanning = useCallback(async () => {
    if (html5QrCodeRef.current) {
      try {
        const isScanning = html5QrCodeRef.current.getState() === 2; // SCANNING state
        if (isScanning) {
          await html5QrCodeRef.current.stop();
        }
        html5QrCodeRef.current.clear();
        html5QrCodeRef.current = null;
      } catch (err) {
        console.error("Error stopping scanner:", err);
      }
    }
    setScanning(false);
  }, []);

  const startScanning = useCallback(async () => {
    try {
      const { Html5Qrcode } = await import('html5-qrcode');

      if (html5QrCodeRef.current) {
        await stopScanning();
      }

      const html5QrCode = new Html5Qrcode("qr-reader");
      html5QrCodeRef.current = html5QrCode;

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0
      };

      await html5QrCode.start(
        { facingMode: "environment" },
        config,
        (decodedText) => {
          onScan(decodedText);
          stopScanning();
        },
        (errorMessage) => {
          // Ignore scanning errors (they happen frequently)
        }
      );

      setScanning(true);
      setError(null);
    } catch (err) {
      console.error("Error starting QR scanner:", err);
      setError("Unable to access camera. Please check permissions.");
      setScanning(false);
    }
  }, [onScan, stopScanning]);

  useEffect(() => {
    if (!isOpen) {
      stopScanning();
      return;
    }

    startScanning();

    return () => {
      stopScanning();
    };
  }, [isOpen, startScanning, stopScanning]);

  const handleClose = async () => {
    await stopScanning();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} maxWidth="max-w-lg">
      <div className="p-6">
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Scan QR Code
          </h2>
          <p className="text-sm text-gray-600">
            Position the QR code within the frame to scan
          </p>
        </div>

        {error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-2">
              <svg
                className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <div>
                <p className="text-sm text-red-700">{error}</p>
                <button
                  onClick={startScanning}
                  className="mt-2 text-sm text-red-600 hover:text-red-700 font-medium underline"
                >
                  Try again
                </button>
              </div>
            </div>
          </div>
        ) : null}

        <div className="bg-gray-100 rounded-lg overflow-hidden mb-4">
          <div id="qr-reader" className="w-full"></div>
        </div>

        {scanning && (
          <div className="text-center mb-4">
            <p className="text-sm text-gray-600">
              Camera is active. Point it at a QR code...
            </p>
          </div>
        )}

        <div className="flex justify-end gap-3">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default QRScannerModal;
