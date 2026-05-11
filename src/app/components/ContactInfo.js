import React, { useState } from "react";
import InputField from "./inputs/InputField";
import { useSurveyContext } from "../context/SurveyContext";

const ContactInfo = () => {
  const [contactDetails, setContactDetails] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    preferredContact: [],
    address: "",
    address2: "",
    city: "",
    state: "",
    zipCode: "",
  });
  const { setState } = useSurveyContext();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setContactDetails((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e) => {
    const { value, checked } = e.target;
    setContactDetails((prev) => ({
      ...prev,
      preferredContact: checked
        ? [...prev.preferredContact, value]
        : prev.preferredContact.filter((method) => method !== value),
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setState((prevState) => ({
      ...prevState,
      step: prevState.step + 1,
    }));
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-6 text-center">
        Contact Information
      </h2>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid md:grid-cols-2 gap-5">
          <InputField
            id="firstName"
            name="firstName"
            label="First Name"
            value={contactDetails.firstName}
            onChange={handleInputChange}
          />
          <InputField
            id="lastName"
            name="lastName"
            label="Last Name"
            value={contactDetails.lastName}
            onChange={handleInputChange}
          />
        </div>
        <div className="grid md:grid-cols-2 gap-5">
          <InputField
            id="email"
            name="email"
            type="email"
            label="Email Address"
            value={contactDetails.email}
            onChange={handleInputChange}
          />
          <InputField
            id="phone"
            name="phone"
            type="tel"
            label="Phone"
            value={contactDetails.phone}
            onChange={handleInputChange}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Preferred Contact Method
          </label>
          <p className="text-xs text-gray-500 mb-2">Select all that apply</p>
          <div className="flex flex-wrap gap-4">
            {["Call", "Text", "Email"].map((method) => (
              <label key={method} className="inline-flex items-center">
                <input
                  type="checkbox"
                  name="preferredContact"
                  value={method}
                  checked={contactDetails.preferredContact.includes(method)}
                  onChange={handleCheckboxChange}
                  className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 h-4 w-4"
                />
                <span className="ml-2 text-sm text-gray-700">{method}</span>
              </label>
            ))}
          </div>
        </div>
        <InputField
          id="address"
          name="address"
          label="Address"
          value={contactDetails.address}
          onChange={handleInputChange}
        />
        <InputField
          id="address2"
          name="address2"
          label="Address 2"
          value={contactDetails.address2}
          onChange={handleInputChange}
        />
        <div className="grid md:grid-cols-3 gap-5">
          <InputField
            id="city"
            name="city"
            label="City"
            value={contactDetails.city}
            onChange={handleInputChange}
          />
          <InputField
            id="state"
            name="state"
            label="State"
            value={contactDetails.state}
            onChange={handleInputChange}
          />
          <InputField
            id="zipCode"
            name="zipCode"
            label="Zip/Postal Code"
            value={contactDetails.zipCode}
            onChange={handleInputChange}
          />
        </div>
        <div className="flex justify-end">
          <button
            type="submit"
            className="bg-indigo-500 hover:bg-indigo-600 text-white text-xl font-bold py-2 px-8 rounded"
          >
            Continue
          </button>
        </div>
      </form>
    </div>
  );
};

export default ContactInfo;
