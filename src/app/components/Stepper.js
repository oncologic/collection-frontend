import { FaCheck } from "react-icons/fa";

export default function Stepper({ steps, handleStepClick, currentStep }) {
  return (
    <div className="mb-6 px-2 md:px-4 w-full">
      <nav aria-label="Progress">
        <ol
          role="list"
          className="divide-y divide-gray-300 rounded-md border border-slate-200 md:flex md:divide-y-0 overflow-scroll"
        >
          {steps.map((step, stepIdx) => {
            // Determine status based on currentStep
            const status =
              stepIdx + 1 < currentStep
                ? "complete"
                : stepIdx + 1 === currentStep
                ? "current"
                : "upcoming";

            return (
              <li key={step.name} className="relative md:flex md:flex-1">
                {status === "complete" ? (
                  <button
                    onClick={() => handleStepClick(stepIdx + 1)}
                    className="group flex w-full items-center hover:border-b-2 hover:border-blue-500"
                  >
                    <span className="flex items-center px-6 py-4 text-sm font-medium">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600">
                        <FaCheck className="h-4 w-4 text-white" />
                      </span>
                      <span className="ml-4 text-sm font-medium text-gray-900">
                        {step.name}
                      </span>
                    </span>
                  </button>
                ) : status === "current" ? (
                  <button
                    href={step.href}
                    aria-current="step"
                    className="flex items-center justify-center px-4 py-4 text-sm font-semibold w-full"
                  >
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full border-2 border-blue-500">
                      <span className="text-blue-500">{step.id}</span>
                    </span>
                    <span className="ml-2 text-base font-semibold text-blue-500">
                      {step.name}
                    </span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleStepClick(stepIdx + 1)}
                    className="group flex items-center justify-center w-full"
                  >
                    <span className="flex items-center px-4 py-4 text-sm font-semibold">
                      <span className="flex size-6 shrink-0 items-center justify-center rounded-full border-2 border-gray-300 group-hover:border-gray-400">
                        <span className="text-gray-500 group-hover:text-gray-900">
                          {step.id}
                        </span>
                      </span>
                      <span className="ml-2 text-sm font-medium text-gray-500 group-hover:text-gray-900">
                        {step.name}
                      </span>
                    </span>
                  </button>
                )}

                {stepIdx !== steps.length - 1 ? (
                  <div
                    aria-hidden="true"
                    className=" right-0 top-0 hidden h-full w-5 md:block"
                  >
                    <svg
                      fill="none"
                      viewBox="0 0 22 80"
                      preserveAspectRatio="none"
                      className="size-full text-gray-300"
                    >
                      <path
                        d="M0 -2L20 40L0 82"
                        stroke="currentcolor"
                        vectorEffect="non-scaling-stroke"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ol>
      </nav>
    </div>
  );
}
