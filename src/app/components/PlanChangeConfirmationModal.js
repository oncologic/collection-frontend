import React from "react";
import {
  FaCheck,
  FaTimes,
  FaArrowUp,
  FaArrowDown,
  FaCrown,
  FaSpinner,
  FaExclamationTriangle,
} from "react-icons/fa";

const PlanChangeConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  validation,
  targetPlan,
  isLoading = false,
}) => {
  if (!isOpen) return null;

  const { changeType, currentPlan, requestedPlan } = validation || {};
  const isUpgrade = changeType === "upgrade";
  const isDowngrade = changeType === "downgrade";

  const getIcon = () => {
    if (isUpgrade) return <FaArrowUp className="w-6 h-6 text-green-500" />;
    if (isDowngrade) return <FaArrowDown className="w-6 h-6 text-orange-500" />;
    return <FaCrown className="w-6 h-6 text-blue-500" />;
  };

  const getTitle = () => {
    if (isUpgrade) return `Upgrade to ${targetPlan?.name}`;
    if (isDowngrade) return `Downgrade to ${targetPlan?.name}`;
    return `Switch to ${targetPlan?.name}`;
  };

  const getDescription = () => {
    if (isUpgrade) {
      return `Unlock more features and capabilities with the ${targetPlan?.name} plan.`;
    }
    if (isDowngrade) {
      return `You'll have reduced access to features with the ${targetPlan?.name} plan.`;
    }
    return `Switch your subscription to the ${targetPlan?.name} plan.`;
  };

  const getFeatures = () => {
    if (isUpgrade) {
      return [
        "Immediate access to new features",
        "Pro-rated billing for current period",
        "New billing cycle starts",
        "Keep all existing data",
      ];
    }
    if (isDowngrade) {
      return [
        "Reduced feature access",
        "Changes at end of billing period",
        "Keep existing data",
        "Can upgrade again anytime",
      ];
    }
    return ["Plan features will be updated", "Billing adjusted accordingly"];
  };

  const getPrice = () => {
    if (typeof targetPlan?.monthlyPrice === "string") {
      return targetPlan.monthlyPrice === "Custom"
        ? "Custom pricing"
        : targetPlan.monthlyPrice;
    }
    return targetPlan?.monthlyPrice === 0
      ? "Free"
      : `$${targetPlan?.monthlyPrice}/month`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl transform transition-all">
        {/* Header */}
        <div
          className={`p-6 rounded-t-2xl ${
            isUpgrade
              ? "bg-gradient-to-r from-green-500 to-emerald-600"
              : isDowngrade
              ? "bg-gradient-to-r from-orange-500 to-amber-600"
              : "bg-gradient-to-r from-blue-500 to-indigo-600"
          } text-white`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getIcon()}
              <div>
                <h3 className="text-xl font-bold">{getTitle()}</h3>
                <p className="text-sm opacity-90">{getDescription()}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors"
              disabled={isLoading}
            >
              <FaTimes className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Price Display */}
          <div className="text-center mb-6">
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {getPrice()}
            </div>
            {targetPlan?.monthlyPrice !== 0 &&
              targetPlan?.monthlyPrice !== "Custom" && (
                <div className="text-sm text-gray-500">
                  {isUpgrade ? "New monthly rate" : "Reduced monthly rate"}
                </div>
              )}
          </div>

          {/* Features */}
          {/* <div className="mb-6">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">
              What happens next:
            </h4>
            <ul className="space-y-2">
              {getFeatures().map((feature, index) => (
                <li
                  key={index}
                  className="flex items-start gap-2 text-sm text-gray-600"
                >
                  <FaCheck className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div> */}

          {/* Warning for downgrades */}
          {isDowngrade && (
            <div className="mb-6 p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex items-start gap-2">
                <FaExclamationTriangle className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-orange-800">
                  <p className="font-medium mb-1">Important:</p>
                  <p>
                    Your downgrade will take effect at the end of your current
                    billing period. You&apos;ll continue to have full access
                    until then.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className={`flex-1 px-4 py-3 rounded-lg text-white font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                isUpgrade
                  ? "bg-green-600 hover:bg-green-700"
                  : isDowngrade
                  ? "bg-orange-600 hover:bg-orange-700"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {isLoading ? (
                <>
                  <FaSpinner className="w-4 h-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>Confirm {changeType || "Change"}</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlanChangeConfirmationModal;
