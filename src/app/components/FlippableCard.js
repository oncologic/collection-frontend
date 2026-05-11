import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChartBar } from "@fortawesome/free-solid-svg-icons";

export default function FlippableCard({ title, value, children, frontStats }) {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div className="relative h-[250px] w-full [perspective:1000px]">
      <div
        className={`relative h-full w-full transition-transform duration-500 [transform-style:preserve-3d] cursor-pointer
          ${isFlipped ? "[transform:rotateY(180deg)]" : ""}`}
        onClick={() => setIsFlipped(!isFlipped)}
      >
        {/* Front of card */}
        <div className="absolute inset-0 [backface-visibility:hidden]">
          <div className="p-6 rounded-lg bg-white shadow-lg h-full">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-semibold text-gray-800">{title}</h3>
              <FontAwesomeIcon
                icon={faChartBar}
                className="text-blue-500 text-xl"
              />
            </div>
            <div className="mt-4">
              <div className="text-3xl font-bold text-blue-600">{value}</div>
              {frontStats && (
                <div className="mt-4 space-y-2 max-h-[150px] overflow-y-auto">
                  {frontStats.map((stat, index) => (
                    <div key={index}>
                      {stat.component ? (
                        stat.component
                      ) : (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">{stat.label}</span>
                          <span className="font-semibold text-gray-600">
                            {stat.value}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Back of card */}
        <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)]">
          <div className="p-6 rounded-lg bg-white shadow-lg h-full">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
