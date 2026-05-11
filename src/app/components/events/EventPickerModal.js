import { DateTime } from "luxon";
import Image from "next/image";

export default function EventPickerModal({ events, onSelect, onClose }) {
  if (!events) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-400 bg-opacity-50 z-50">
      <div className="bg-white p-4 rounded-lg max-w-md w-full max-h-[80vh] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4">Select Event</h3>
        <div className="space-y-2">
          {events.map((event) => (
            <button
              key={event.id}
              onClick={() => onSelect(event)}
              className="w-full text-left p-2 hover:bg-gray-100 rounded-lg flex items-center gap-2"
            >
              {event.organizations?.[0]?.imageUrl && (
                <div className="relative w-8 h-8 flex-shrink-0">
                  <Image
                    width={32}
                    height={32}
                    src={event.organizations[0].imageUrl}
                    alt=""
                    className="object-contain rounded-md"
                  />
                </div>
              )}
              <div className="flex-1">
                <div className="font-medium">{event.title}</div>
                <div className="text-sm text-gray-500">
                  {DateTime.fromISO(event.startDate.replace(" ", "T")).toFormat(
                    "h:mm a"
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
        <button
          onClick={onClose}
          className="mt-4 w-full px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 hidden md:block"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
