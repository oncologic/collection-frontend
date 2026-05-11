"use client";

import React, { useState, useEffect } from "react";
import Modal from "../components/Modal";
import { FaHeart, FaUsers, FaExternalLinkAlt } from "react-icons/fa";

const PubMedFirstVisitModal = ({ isOpen, onClose }) => {
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const handleClose = () => {
    if (dontShowAgain) {
      localStorage.setItem("pubmed-first-visit-seen", "true");
    }
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} maxWidth="max-w-4xl">
      <div className="p-6">
        <div className="flex items-start mb-4">
          <div className="ml-3 flex-1">
            <h2 className="text-2xl font-bold text-gray-900">PubMed Search</h2>
          </div>
        </div>

        <div className="space-y-4 mb-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg pt-4 px-4 pb-4">
            <p className="text-sm text-blue-900 mb-2">
              <strong>
                A Note from Our Founder (also a patient/survivor):
              </strong>
            </p>
            <p className="text-sm text-blue-800 leading-relaxed">
              As someone who has navigated a cancer diagnosis myself, I know
              firsthand how overwhelming medical research can feel, especially
              early in a diagnosis. These articles are written for researchers
              and clinicians, so take breaks when you need them. In case you
              find articles distressing, I personally found connecting with
              other patients through support groups helpful. Below you&apos;ll
              find a list of support communities available.
            </p>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
              <FaUsers className="mr-2 text-blue-500" />
              Support Communities
            </h3>
            <p className="text-sm text-gray-700 mb-3">
              Connect with others who understand your experience through online
              support communities.
            </p>
            <a
              href="https://www.kidneycancer.org/get-support/support-communities/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              <FaExternalLinkAlt className="mr-2" />
              Visit Support Communities
            </a>
            <p className="text-xs text-gray-600 mt-2">
              Not an endorsment of any specific support community or the content
              of the community.
            </p>
          </div>
        </div>

        <div className="flex items-center mb-4">
          <input
            type="checkbox"
            id="dontShowAgain"
            checked={dontShowAgain}
            onChange={(e) => setDontShowAgain(e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="dontShowAgain" className="ml-2 text-sm text-gray-700">
            Don&apos;t show this message again
          </label>
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleClose}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
          >
            Continue to Search
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default PubMedFirstVisitModal;
