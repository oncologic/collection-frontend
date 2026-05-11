"use client";

import { useState } from "react";
import Image from "next/image";

const ImageUpload = ({ onImageSelected }) => {
  const [previewUrl, setPreviewUrl] = useState(null);

  const onFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setPreviewUrl(URL.createObjectURL(file));
      onImageSelected(file);
    }
  };

  return (
    <div className="w-full">
      <div className="flex flex-col items-center space-y-4">
        {/* Preview Area */}
        {previewUrl && (
          <div className="relative w-40 aspect-square">
            <Image
              width={160}
              height={160}
              src={previewUrl}
              alt="Preview"
              className="w-full h-full object-cover rounded-lg"
            />
          </div>
        )}

        {/* Upload Button */}
        <p className="text-xs text-gray-500">
          Upload a square image (recommended size: 200x200px)
        </p>
        <label className="cursor-pointer bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors">
          {previewUrl ? "Change Image" : "Upload Image"}
          <input
            type="file"
            className="hidden"
            accept="image/*"
            onChange={onFileChange}
          />
        </label>
      </div>
    </div>
  );
};

export default ImageUpload;
