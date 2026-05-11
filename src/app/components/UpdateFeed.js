import { FaCheckCircle } from "react-icons/fa";

export default function UpdateFeed({ updates }) {
  return (
    <div className="flow-root">
      <ul role="list" className="-mb-8">
        {updates.map((update, eventIdx) => (
          <li key={update.id} className="relative pb-8">
            {eventIdx !== updates.length - 1 && (
              <div className="absolute left-2 top-4 h-full border-l border-gray-300" />
            )}
            <div className="relative flex space-x-3">
              <div>
                <span
                  className={
                    "flex size-4 items-center justify-center rounded-full ring-4 ring-green-200"
                  }
                >
                  <FaCheckCircle className="text-blue-400" />
                </span>
              </div>
              <div className="flex min-w-0 flex-1 justify-between space-x-4">
                <div>
                  <p className="text-sm text-gray-500">
                    {update.linkUrl ? (
                      <a
                        href={update.linkUrl}
                        className="font-medium text-blue-400"
                      >
                        {update.description}
                      </a>
                    ) : (
                      update.description
                    )}{" "}
                  </p>
                </div>
                {/* <div className="whitespace-nowrap text-right text-sm text-gray-500">
                  <time dateTime={update.datetime}>{update.date}</time>
                </div> */}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
