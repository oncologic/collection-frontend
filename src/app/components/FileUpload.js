import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faInfoCircle } from "@fortawesome/free-solid-svg-icons";
import VideoEmbed from "./VideoEmbed";

function FileUpload() {
  const [selectedOption, setSelectedOption] = useState("");
  const [showInfo, setShowInfo] = useState(false);
  const [files, setFiles] = useState({});
  const [isFileUploaded, setIsFileUploaded] = useState(false);

  const recordTypes = [
    { title: "Full Record", description: "Export your full record and upload" },
    {
      title: "Pathology Reports",
      description:
        "Upload any reports from any pathology reports you've received related to your kidney cancer",
    },
    {
      title: "Radiology Reports",
      description:
        "Upload any reports from any imaging or scans you've received.",
    },
    {
      title: "Treatments / Medication List",
      description:
        "Upload any treatments or medications you've received related to your kidney cancer",
    },
    {
      title: "Surgical Reports",
      description:
        "Upload any reports from any imaging or scans you've received.",
    },
  ];
  const handleContinue = () => {
    // Logic to move to the next step
  };

  const handleFileChange = (event, recordTitle) => {
    const uploadedFiles = Array.from(event.target.files);
    setFiles((prevFiles) => ({
      ...prevFiles,
      [recordTitle]: uploadedFiles,
    }));
    setIsFileUploaded(uploadedFiles.length > 0);
  };

  return (
    <div className="donation-options p-6 bg-white rounded-lg shadow-md mb-10 h-full">
      <h2 className="text-4xl font-bold mb-6 text-gray-600 text-center">
        Upload Records
      </h2>
      <div className="h-full mx-auto aspect-video w-3/4">
        <VideoEmbed videoId="YQHsXMglC9A" />
      </div>
      <div>
        <div className="mt-8 space-y-1">
          {recordTypes.map((record, index) => (
            <div key={index}>
              {index === 1 && (
                <div
                  className={`w-1/4 font-semibold mx-auto flex justify-center bg-blue-500 text-white text-center rounded mt-4 mb-4 py-1 ${
                    isFileUploaded ? "opacity-50" : ""
                  }`}
                >
                  OR
                </div>
              )}
              <div
                className={`flex items-start justify-between p-4 border rounded-lg hover:bg-gray-50 ${
                  (files["Full Record"] && files["Full Record"].length > 0) ||
                  (files["Pathology Reports"] &&
                    files["Pathology Reports"].length > 0) ||
                  (files["Radiology Reports"] &&
                    files["Radiology Reports"].length > 0)
                    ? record.title !== "Full Record"
                      ? "opacity-50"
                      : ""
                    : ""
                }`}
              >
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-700">
                    {record.title}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {record.description}
                  </p>
                </div>
                <div className="ml-4 flex justify-end flex-col gap-2">
                  <div className="relative cursor-pointer flex justify-end">
                    <div className="bg-blue-50 hover:bg-blue-100 w-40 text-center justify-end text-blue-600 rounded-lg px-4 py-2 transition-colors">
                      <span className="text-sm font-medium">Choose Files</span>
                      <input
                        type="file"
                        multiple
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        onChange={(e) => handleFileChange(e, record.title)}
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      />
                    </div>
                  </div>
                  <div className="ml-2">
                    {files[record.title] && files[record.title].length > 0 && (
                      <div className="ml-2 text-sm text-gray-500">
                        {files[record.title]
                          .map((file) => file.name)
                          .join(", ")}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="flex justify-end mt-12">
        <button
          onClick={handleContinue}
          className={`text-white text-xl font-bold py-2 px-8 rounded ${
            isFileUploaded ? "bg-blue-500 hover:bg-blue-600" : "bg-blue-100"
          }`}
          disabled={!isFileUploaded}
        >
          Continue
        </button>
      </div>
    </div>
  );
}

export default FileUpload;
