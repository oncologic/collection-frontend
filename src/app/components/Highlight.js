import React from "react";

const Highlight = ({ message }) => {
  return (
    <div className="bg-blue-400 text-white p-4 rounded-lg shadow-md mb-4 w-full">
      <strong>Latest Update:</strong> {message}
    </div>
  );
};

export default Highlight;
