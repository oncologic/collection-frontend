"use client";
import { useState } from "react";
import {
  useStripe,
  useElements,
  PaymentElement,
} from "@stripe/react-stripe-js";
import { toast } from "react-hot-toast";

export const SubscriptionCheckoutForm = ({
  planName,
  planPrice,
  planDisplayName,
  onSuccess,
  onCancel,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/dashboard`,
        },
        redirect: "if_required",
      });

      if (error) {
        toast.error(error.message || "Payment failed");
      } else {
        toast.success("Subscription created successfully!");
        onSuccess();
      }
    } catch (err) {
      toast.error("Payment failed");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="w-full">
      <div className="mb-4 p-3 bg-blue-50 rounded-lg">
        <h3 className="text-base font-semibold text-blue-900 mb-1">
          {planDisplayName} Plan
        </h3>
        <p className="text-blue-800 font-medium">${planPrice}/month</p>
        <p className="text-blue-600 text-sm">Billed monthly</p>
      </div>

      <form onSubmit={handleSubmit} className="w-full">
        <PaymentElement />

        <div className="flex gap-2 mt-4">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors text-sm"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!stripe || isProcessing}
            className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg disabled:opacity-50 transition-colors text-sm"
          >
            {isProcessing ? "Processing..." : `Subscribe $${planPrice}/mo`}
          </button>
        </div>
      </form>
    </div>
  );
};
