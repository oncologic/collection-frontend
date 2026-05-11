import React from "react";

export default function ActionButton({
  onClick,
  type = "button",
  disabled = false,
  variant = "primary",
  children,
  className = "",
}) {
  const baseStyles =
    "text-white text-xl font-bold py-2 px-8 rounded transition-colors";

  const variants = {
    primary: "bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300",
    secondary: "bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-300",
    dark: "bg-slate-900 text-white hover:bg-slate-600 disabled:bg-slate-300",
    danger: "bg-red-500 hover:bg-red-600 disabled:bg-red-300",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}
