"use client";

import { useState, useEffect } from "react";
import InputField from "./InputField";
import SelectField from "./SelectField";
import { Country, State } from "country-state-city";
import countries from "i18n-iso-countries";
import en from "i18n-iso-countries/langs/en.json";

// Initialize the countries library with English language
countries.registerLocale(en);

const LocationComponent = ({
  control,
  register,
  errors,
  setValue,
  defaultValues = {},
  required = true,
}) => {
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [selectedState, setSelectedState] = useState(null);
  const [countryOptions, setCountryOptions] = useState([]);
  const [stateOptions, setStateOptions] = useState([]);

  // Initialize countries on component mount
  useEffect(() => {
    const formattedCountries = Country.getAllCountries().map((country) => ({
      id: country.isoCode,
      name: `${country.name} (${country.isoCode})`,
    }));
    setCountryOptions(formattedCountries);

    // Set default country if provided and not empty
    if (defaultValues.country && defaultValues.country.trim() !== "") {
      let countryCode;

      // Handle different formats of country data
      if (typeof defaultValues.country === "string") {
        countryCode = defaultValues.country;
      } else if (defaultValues.country && defaultValues.country.id) {
        countryCode = defaultValues.country.id;
      } else if (defaultValues.country && defaultValues.country.isoCode) {
        countryCode = defaultValues.country.isoCode;
      }

      const defaultCountry = formattedCountries.find(
        (c) => c.id === countryCode
      );

      if (defaultCountry) {
        setSelectedCountry(defaultCountry);
        // Immediately populate states for the default country
        const states = State.getStatesOfCountry(defaultCountry.id).map(
          (state) => ({
            id: state.isoCode,
            name: `${state.name} (${state.isoCode})`,
          })
        );

        setStateOptions(states);
        setValue("country", defaultCountry.id);

        // Set default state if provided and not empty
        if (defaultValues.state && defaultValues.state.trim() !== "") {
          let stateCode;

          // Handle different formats of state data
          if (typeof defaultValues.state === "string") {
            stateCode = defaultValues.state;
          } else if (defaultValues.state && defaultValues.state.id) {
            stateCode = defaultValues.state.id;
          } else if (defaultValues.state && defaultValues.state.isoCode) {
            stateCode = defaultValues.state.isoCode;
          }

          const defaultState = states.find((s) => s.id === stateCode);
          if (defaultState) {
            setSelectedState(defaultState);
            setValue("state", defaultState.id);
          }
        }
      }
    }
  }, [defaultValues.country, defaultValues.state, setValue]);

  const handleCountryChange = (country) => {
    if (!country) {
      setSelectedCountry(null);
      setStateOptions([]);
      setSelectedState(null);
      setValue("country", "");
      setValue("state", "");
      return;
    }

    setSelectedCountry(country);
    setValue("country", country.id);

    // Update states based on selected country
    const states = State.getStatesOfCountry(country.id).map((state) => ({
      id: state.isoCode,
      name: `${state.name} (${state.isoCode})`,
    }));
    setStateOptions(states);

    // Reset state selection when country changes (unless it's the initial load)
    setSelectedState(null);
    setValue("state", "");
  };

  const handleStateChange = (state) => {
    if (!state) {
      setSelectedState(null);
      setValue("state", "");
      return;
    }
    setSelectedState(state);
    setValue("state", state.id);
  };

  return (
    <div className="space-y-4">
      <InputField
        id="address"
        name="address"
        label="Street Address"
        required={required}
        placeholder="Enter street address"
        register={register}
        error={errors?.address?.message}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InputField
          id="city"
          name="city"
          label="City"
          required={required}
          placeholder="Enter city"
          register={register}
          error={errors?.city?.message}
        />

        <SelectField
          label="State/Province/Region"
          options={stateOptions}
          placeholder="Select state/province/region"
          value={selectedState}
          onChange={handleStateChange}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InputField
          id="postal"
          name="postal"
          label="Postal Code"
          required={required}
          placeholder="Enter postal code"
          register={register}
          error={errors?.postal?.message}
        />

        <SelectField
          label="Country"
          options={countryOptions}
          placeholder="Select country"
          value={selectedCountry}
          onChange={handleCountryChange}
        />
      </div>
    </div>
  );
};

export default LocationComponent;
