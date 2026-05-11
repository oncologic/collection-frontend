import React, { useState, useRef, useEffect } from "react";
import { useSurveyContext } from "../context/SurveyContext";
import InputField from "./inputs/InputField";
import { Switch } from "@headlessui/react";
import LoadingSkeleton from "./LoadingSkeleton";
import ActionButton from "./common/ActionButton";

const Consent = () => {
  const [isScrolledToBottom, setIsScrolledToBottom] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [loading, setLoading] = useState(true);
  const consentTextRef = useRef(null);
  const { setState } = useSurveyContext();

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const handleScroll = () => {
    const element = consentTextRef.current;
    if (element) {
      const { scrollTop, scrollHeight, clientHeight } = element;
      if (scrollTop + clientHeight >= scrollHeight - 5) {
        setIsScrolledToBottom(true);
      }
    }
  };

  useEffect(() => {
    const element = consentTextRef.current;
    if (element) {
      element.addEventListener("scroll", handleScroll);
    }
    return () => {
      if (element) {
        element.removeEventListener("scroll", handleScroll);
      }
    };
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (agreed && firstName && lastName) {
      setState((prevState) => ({
        ...prevState,
        step: prevState.step + 1,
      }));
    }
  };

  const loadingBars = [
    { width: "5/6", height: "4", lineGap: "0" },
    { width: "5/6", height: "4", lineGap: "4" },
    { width: "full", height: "4", lineGap: "4" },
    { width: "full", height: "4", lineGap: "4" },
    { width: "5/6", height: "4", lineGap: "8" },
    { width: "5/6", height: "4", lineGap: "4" },
    { width: "full", height: "4", lineGap: "4" },
    { width: "full", height: "4", lineGap: "4" },
  ];

  return (
    <div className="p-4">
      <h2 className="text-3xl font-bold mb-6 text-center">Consent</h2>
      <div
        ref={consentTextRef}
        className="h-96 overflow-y-scroll border p-4 mb-4 rounded"
        style={{ scrollBehavior: "smooth" }}
      >
        {loading ? (
          <LoadingSkeleton backgroundHeight="h-96" bars={loadingBars} />
        ) : (
          <div className="flex flex-col gap-4">
            <p>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
              eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut
              enim ad minim veniam, quis nostrud exercitation ullamco laboris
              nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in
              reprehenderit in voluptate velit esse cillum dolore eu fugiat
              nulla pariatur. Excepteur sint occaecat cupidatat non proident,
              sunt in culpa qui officia deserunt mollit anim id est laborum.
            </p>
            <p>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
              eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut
              enim ad minim veniam, quis nostrud exercitation ullamco laboris
              nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in
              reprehenderit in voluptate velit esse cillum dolore eu fugiat
              nulla pariatur. Excepteur sint occaecat cupidatat non proident,
              sunt in culpa qui officia deserunt mollit anim id est laborum.
            </p>
            <p>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
              eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut
              enim ad minim veniam, quis nostrud exercitation ullamco laboris
              nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in
              reprehenderit in voluptate velit esse cillum dolore eu fugiat
              nulla pariatur. Excepteur sint occaecat cupidatat non proident,
              sunt in culpa qui officia deserunt mollit anim id est laborum.
            </p>
            <p>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
              eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut
              enim ad minim veniam, quis nostrud exercitation ullamco laboris
              nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in
              reprehenderit in voluptate velit esse cillum dolore eu fugiat
              nulla pariatur. Excepteur sint occaecat cupidatat non proident,
              sunt in culpa qui officia deserunt mollit anim id est laborum.
            </p>
            <p>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
              eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut
              enim ad minim veniam, quis nostrud exercitation ullamco laboris
              nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in
              reprehenderit in voluptate velit esse cillum dolore eu fugiat
              nulla pariatur. Excepteur sint occaecat cupidatat non proident,
              sunt in culpa qui officia deserunt mollit anim id est laborum.
            </p>
            <p>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
              eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut
              enim ad minim veniam, quis nostrud exercitation ullamco laboris
              nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in
              reprehenderit in voluptate velit esse cillum dolore eu fugiat
              nulla pariatur. Excepteur sint occaecat cupidatat non proident,
              sunt in culpa qui officia deserunt mollit anim id est laborum.
            </p>
          </div>
        )}
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center">
          <Switch
            checked={agreed}
            onChange={setAgreed}
            disabled={!isScrolledToBottom}
            className={`${
              agreed ? "bg-blue-600" : "bg-gray-200"
            } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              !isScrolledToBottom ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            <span className="sr-only">Agree to consent form</span>
            <span
              className={`${
                agreed ? "translate-x-6" : "translate-x-1"
              } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
            />
          </Switch>
          <label htmlFor="agree" className="ml-3 text-sm">
            I have read and agree to the consent form
          </label>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <InputField
            id="firstName"
            name="firstName"
            label="First Name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
          />
          <InputField
            id="lastName"
            name="lastName"
            label="Last Name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
          />
        </div>
        <div className="flex justify-end">
          <ActionButton
            variant="primary"
            type="submit"
            disabled={!agreed || !firstName || !lastName}
          >
            Sign Consent
          </ActionButton>
        </div>
      </form>
    </div>
  );
};

export default Consent;
