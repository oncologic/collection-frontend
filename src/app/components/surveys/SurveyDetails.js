import { DateTime } from "luxon";
import Image from "next/image";
import Link from "next/link";
import CustomEditor from "../common/CustomEditor";

export const SurveyDetail = ({ survey, onClose, isAdmin = false }) => {
  if (!survey) return null;

  // Convert dates to DateTime objects and format them
  const openDate = DateTime.fromFormat(
    survey.openDate,
    "yyyy-MM-dd HH:mm:ssZZ"
  );
  const closeDate = DateTime.fromFormat(
    survey.closeDate,
    "yyyy-MM-dd HH:mm:ssZZ"
  );

  // No need to setZone since the dates already include timezone information
  const openInTz = openDate;
  const closeInTz = closeDate;

  const dateStr = openInTz.toFormat("MMMM d, yyyy");
  const endDateStr = closeInTz.toFormat("MMMM d, yyyy");
  const timeStr = `${openInTz.toFormat("h:mm a")} - ${closeInTz.toFormat(
    "h:mm a"
  )} ${openInTz.toFormat("ZZZZ")}`.replace("Time", "");

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)]">
      <div className=" mb-12">
        {/* Header Section */}
        <div className="bg-slate-700 text-white rounded-md py-3 sm:py-4 px-4 sm:px-6 mb-4 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
            {survey.organizations && survey.organizations.length > 0 && (
              <div className="flex justify-center sm:justify-start flex-wrap md:flex-nowrap items-center gap-2 sm:gap-4 rounded-md  md:bg-transparent p-1 sm:p-2">
                {survey.organizations.map(
                  (org) =>
                    org.imageUrl && (
                      <div
                        key={org.id}
                        className="relative w-12 h-12 sm:w-16 sm:h-16 flex-shrink-0 rounded-md bg-white p-1"
                      >
                        <Image
                          width={48}
                          height={48}
                          src={org.imageUrl}
                          alt={org.name}
                          className="object-contain rounded-md"
                        />
                      </div>
                    )
                )}
              </div>
            )}

            <div className="space-y-2">
              <h2 className="text-2xl font-bold">{survey.name}</h2>
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex capitalize items-center rounded-full bg-blue-500 bg-opacity-30 px-2 py-0.5 text-xs sm:text-sm font-medium text-white ring-1 ring-inset ring-white/10">
                  {survey.surveyTypeName}
                </span>
                {survey.hasResponded && (
                  <span className="inline-flex items-center rounded-full bg-green-500 bg-opacity-30 px-2 py-0.5 text-xs sm:text-sm font-medium text-white ring-1 ring-inset ring-white/10">
                    Completed
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column - Details */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Description
              </h3>
              <div className="text-gray-600">
                <CustomEditor
                  content={survey.description}
                  readOnly={true}
                  height="350px"
                />
              </div>
            </div>
          </div>

          {/* Right Column - Survey Info */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Survey Information
              </h3>
              <div className="space-y-4 text-sm text-gray-600">
                <p className="text-lg">
                  <span className="font-semibold">Open:</span>{" "}
                  {dateStr === endDateStr
                    ? dateStr
                    : `${dateStr} - ${endDateStr}`}
                  <br />
                  {/* <div className="text-sm">
                    <p>
                      <span className="font-semibold">Start Time:</span>{" "}
                      {openInTz.toFormat("h:mm a")}{" "}
                      {openInTz.toFormat("ZZZZ").replace("Time", "")}
                    </p>
                    <p>
                      <span className="font-semibold">End Time:</span>{" "}
                      {closeInTz.toFormat("h:mm a")}{" "}
                      {closeInTz.toFormat("ZZZZ").replace("Time", "")}
                    </p>
                  </div> */}
                </p>
                <div className="flex flex-col gap-2">
                  <p>
                    <span className="font-semibold">Organizations:</span>{" "}
                    {survey.organizations?.map((org) => org.name).join(", ")}
                  </p>
                  <p className="capitalize">
                    <span className="font-semibold">Survey Type:</span>{" "}
                    {survey.surveyTypeName}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Actions - Now fixed at bottom */}
      <div className=" flex flex-col-reverse sm:flex-row justify-end items-center gap-4">
        {/* Secondary Actions Group */}
        <div className="flex flex-wrap justify-center gap-3">
          {survey.link && (
            <Link
              href={survey.link}
              target="_blank"
              className="px-4 py-2 text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 rounded-lg transition-colors duration-200 border border-blue-500/20 hover:border-blue-500/40"
            >
              Go to Survey
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};
