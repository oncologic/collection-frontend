import { useState, useEffect, useRef } from "react";
import { FaFolder, FaEdit, FaTrash, FaShare } from "react-icons/fa";

export default function FolderContextMenu({
  x,
  y,
  onClose,
  onRename,
  onDelete,
  onShare,
  onCreateSubfolder,
}) {
  const menuRef = useRef();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  const menuItems = [
    { icon: FaFolder, label: "New Subfolder", onClick: onCreateSubfolder },
    { icon: FaEdit, label: "Rename", onClick: onRename },
    { icon: FaShare, label: "Share", onClick: onShare },
    { icon: FaTrash, label: "Delete", onClick: onDelete },
  ];

  return (
    <div
      ref={menuRef}
      className="absolute bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50"
      style={{ top: y, left: x }}
    >
      {menuItems.map((item, index) => (
        <button
          key={index}
          onClick={() => {
            item.onClick();
            onClose();
          }}
          className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center space-x-2"
        >
          <item.icon className="text-gray-400" />
          <span>{item.label}</span>
        </button>
      ))}
    </div>
  );
}
