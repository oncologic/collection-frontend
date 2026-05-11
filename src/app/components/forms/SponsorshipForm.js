import { useForm } from "react-hook-form";
import { useEffect } from "react";
import Modal from "../Modal";

const SponsorshipFormModal = ({
  isOpen,
  onClose,
  selectedTier,
  event,
  onSubmit,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      notes: "",
      company: "",
      itemQuantity: "",
      itemDescription: "",
    },
  });

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      reset();
    }
  }, [isOpen, reset]);

  const onSubmitWrapper = async (data) => {
    const formData = {
      ...data,
      tierId: selectedTier?.id,
      tierName: selectedTier?.name,
      tierPrice: selectedTier?.price,
      eventId: event?.id,
      submittedAt: new Date().toISOString(),
      eventName: event?.title,
    };

    onSubmit(formData);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="w-1/3">
      <div className="bg-white p-6 rounded-lg  w-full mx-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Submit Sponsorship Interest
        </h2>

        {/* Selected Package Info */}
        <div className="p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800 font-medium text-center">
            Selected Package: {selectedTier?.name}
          </p>
          <p className="text-lg font-bold text-blue-900 text-center">
            ${selectedTier?.price?.toLocaleString()}
          </p>
        </div>
        <p className="text-sm text-gray-700 mt-2 text-center mb-6">
          For item donations, include the item details and qty in the notes.
        </p>

        <form onSubmit={handleSubmit(onSubmitWrapper)} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name *
            </label>
            <input
              type="text"
              {...register("name", { required: "Name is required" })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Company *
            </label>
            <input
              type="text"
              {...register("company", { required: "Company is required" })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
            />
            {errors.company && (
              <p className="text-red-500 text-sm mt-1">
                {errors.company.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email *
            </label>
            <input
              type="email"
              {...register("email", {
                required: "Email is required",
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: "Invalid email address",
                },
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">
                {errors.email.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone
            </label>
            <input
              type="tel"
              {...register("phone")}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
              placeholder="555-555-5555"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Additional Notes
            </label>
            <textarea
              {...register("notes")}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
            />
          </div>

          {selectedTier?.type === "item" && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantity of Items *
                </label>
                <input
                  type="number"
                  {...register("itemQuantity", {
                    required: "Quantity is required",
                    min: { value: 1, message: "Quantity must be at least 1" },
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                />
                {errors.itemQuantity && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.itemQuantity.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Item Description *
                </label>
                <textarea
                  {...register("itemDescription", {
                    required: "Item description is required",
                  })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                  placeholder="Please describe the item(s) you plan to donate..."
                />
                {errors.itemDescription && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.itemDescription.message}
                  </p>
                )}
              </div>
            </>
          )}

          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Submit
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default SponsorshipFormModal;
