// import { useForm } from "react-hook-form";
// import { DateTime } from "luxon";

// export default function AddEventModal({
//   open,
//   onClose,
//   onSubmit,
//   organizations,
// }) {
//   const {
//     register,
//     handleSubmit,
//     formState: { errors },
//     reset,
//   } = useForm();

//   const submit = (data) => {
//     const { localDatetime, timezone, ...rest } = data;
//     const utcDate = DateTime.fromISO(localDatetime, { zone: timezone })
//       .toUTC()
//       .toISO();
//     onSubmit({ ...rest, timezone, date: utcDate });
//     reset();
//   };

//   if (!open) return null;

//   return (
//     <div
//       className="fixed inset-0 bg-gray-400      bg-opacity-40 flex items-center justify-center z-50"
//       onClick={(e) => e.stopPropagation()}
//     >
//       <div className="bg-white p-6 rounded-lg w-full max-w-md">
//         <h2 className="text-xl font-bold mb-4">Add New Event</h2>
//         <form onSubmit={handleSubmit(submit)} className="space-y-4">
//           <div>
//             <label className="block mb-1 font-semibold">Organization</label>
//             <select
//               className="w-full border rounded p-2"
//               {...register("organizationId", { required: true })}
//             >
//               <option value="">Select Organization</option>
//               {organizations.map((org) => (
//                 <option key={org.id} value={org.id}>
//                   {org.name}
//                 </option>
//               ))}
//             </select>
//             {errors.organizationId && (
//               <span className="text-red-500 text-sm">Required</span>
//             )}
//           </div>

//           <div>
//             <label className="block mb-1 font-semibold">Title</label>
//             <input
//               className="w-full border rounded p-2"
//               {...register("title", { required: true })}
//             />
//             {errors.title && (
//               <span className="text-red-500 text-sm">Required</span>
//             )}
//           </div>

//           <div>
//             <label className="block mb-1 font-semibold">Description</label>
//             <input
//               className="w-full border rounded p-2"
//               {...register("description", { required: true })}
//             />
//             {errors.description && (
//               <span className="text-red-500 text-sm">Required</span>
//             )}
//           </div>

//           <div>
//             <label className="block mb-1 font-semibold">Date & Time</label>
//             <input
//               type="datetime-local"
//               className="w-full border rounded p-2"
//               {...register("date", { required: true })}
//             />
//             {errors.date && (
//               <span className="text-red-500 text-sm">Required</span>
//             )}
//           </div>

//           <div>
//             <label className="block mb-1 font-semibold">Event Time</label>
//             <input
//               type="datetime-local"
//               className="w-full border rounded p-2"
//               {...register("localDatetime", { required: true })}
//             />
//             {errors.localDatetime && (
//               <span className="text-red-500 text-sm">Required</span>
//             )}
//           </div>

//           <div>
//             <label className="block mb-1 font-semibold">Event Time Zone</label>
//             <select
//               className="w-full border rounded p-2"
//               {...register("timezone", { required: true })}
//             >
//               <option value="America/New_York">America/New_York</option>
//               <option value="Europe/London">Europe/London</option>
//               <option value="Asia/Tokyo">Asia/Tokyo</option>
//               {/* ... more time zones ... */}
//             </select>
//             {errors.timezone && (
//               <span className="text-red-500 text-sm">Required</span>
//             )}
//           </div>

//           <div className="flex justify-end space-x-2 mt-4">
//             <button
//               type="button"
//               onClick={onClose}
//               className="border px-4 py-2 rounded hover:bg-gray-100"
//             >
//               Cancel
//             </button>
//             <button
//               type="submit"
//               className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
//             >
//               Add Event
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// }
