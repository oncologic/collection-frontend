"use client";
import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";

const Tooltip = ({ children, visible, position }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Ensures the component is mounted before referencing document.body
    setMounted(true);
  }, []);

  if (!mounted || !visible) return null;

  return createPortal(
    <div
      style={{
        position: "absolute",
        top: position.top,
        left: position.left,
      }}
      className="z-50 whitespace-nowrap bg-gray-500 text-white text-xs px-2 py-1 rounded transition-opacity duration-200"
    >
      {children}
    </div>,
    document.body
  );
};

export default Tooltip;
