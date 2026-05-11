"use client";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { GoogleMap, Marker, InfoWindow } from "@react-google-maps/api";
import { FaMapMarkerAlt, FaExternalLinkAlt, FaEye } from "react-icons/fa";

const TrialMapView = ({
  trials,
  selectedTrial,
  onBoundsChanged,
  onMarkerClick,
  onTrialSelect,
  formatDate,
  selectionMode = false,
  selectedTrials = [],
  onTrialToggleSelect,
  locationFilter = "",
}) => {
  const [markers, setMarkers] = useState([]);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [map, setMap] = useState(null);
  const [geocoder, setGeocoder] = useState(null);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [geocodingProgress, setGeocodingProgress] = useState({
    current: 0,
    total: 0,
  });
  const processingRef = useRef(false);
  const lastTrialsHashRef = useRef("");

  // Default map options
  const mapOptions = {
    disableDefaultUI: true,
    zoomControl: true,
    styles: [
      {
        featureType: "poi",
        elementType: "labels",
        stylers: [{ visibility: "off" }],
      },
    ],
  };

  const geocodeLocation = useCallback(
    async (locationData) => {
      if (!geocoder || !locationData.city) return null;

      // Improve country name mapping for better geocoding
      const countryMappings = {
        "Korea, Republic of": "South Korea",
        "United States": "USA",
        "United Kingdom": "UK",
      };

      // Build address string with improved country handling
      let address = locationData.city;
      if (locationData.state) {
        address += `, ${locationData.state}`;
      }

      const country =
        countryMappings[locationData.country] || locationData.country;
      if (country) {
        address += `, ${country}`;
      }

      try {
        const result = await new Promise((resolve, reject) => {
          geocoder.geocode(
            {
              address,
              componentRestrictions: country
                ? {
                    country:
                      country === "South Korea" ? "KR" : country.toLowerCase(),
                  }
                : undefined,
            },
            (results, status) => {
              if (status === "OK" && results[0]) {
                resolve(results[0]);
              } else if (status === "OVER_QUERY_LIMIT") {
                console.warn(
                  `Rate limit hit for ${address}, retrying later...`
                );
                // Wait longer and retry once
                setTimeout(() => {
                  geocoder.geocode({ address }, (retryResults, retryStatus) => {
                    if (retryStatus === "OK" && retryResults[0]) {
                      resolve(retryResults[0]);
                    } else {
                      reject(`Retry failed: ${retryStatus}`);
                    }
                  });
                }, 1000);
              } else {
                reject(status);
              }
            }
          );
        });

        return {
          lat: result.geometry.location.lat(),
          lng: result.geometry.location.lng(),
        };
      } catch (error) {
        console.warn(`Geocoding failed for ${address}, trying fallback...`);

        // Try fallback with just city and country
        if (locationData.state) {
          try {
            const fallbackAddress = `${locationData.city}, ${country}`;
            const fallbackResult = await new Promise((resolve, reject) => {
              geocoder.geocode(
                { address: fallbackAddress },
                (results, status) => {
                  if (status === "OK" && results[0]) {
                    resolve(results[0]);
                  } else {
                    reject(status);
                  }
                }
              );
            });

            return {
              lat: fallbackResult.geometry.location.lat(),
              lng: fallbackResult.geometry.location.lng(),
            };
          } catch (fallbackError) {
            console.error(
              `Geocoding completely failed for ${locationData.city}, ${country}:`,
              fallbackError
            );
            return null;
          }
        }

        return null;
      }
    },
    [geocoder]
  );

  // Handle map load success
  const handleMapLoad = (mapInstance) => {
    setMap(mapInstance);
    if (window.google) {
      setGeocoder(new window.google.maps.Geocoder());
    } else {
      console.error("Google Maps API not available");
    }
  };

  // Process trials when they change
  useEffect(() => {
    if (!trials || !geocoder || trials.length === 0) {
      return;
    }

    // Create a simple hash of the trials to check if they've actually changed
    const trialsHash = JSON.stringify(
      trials.map((t) => t.NCTId || t.id).sort()
    );

    // If already processing or trials haven't changed, skip
    if (processingRef.current || trialsHash === lastTrialsHashRef.current) {
      return;
    }

    processingRef.current = true;
    lastTrialsHashRef.current = trialsHash;

    const processTrials = async () => {
      setIsGeocoding(true);
      setGeocodingProgress({ current: 0, total: 0 });

      const allMarkers = [];
      let processedLocations = 0;
      let successfulGeocoding = 0;
      const MAX_LOCATIONS = 50; // Limit to prevent rate limiting issues

      // First pass: count total locations to process
      let totalLocations = 0;
      for (const trial of trials) {
        const countries = trial.LocationCountry || [];
        const cities = trial.LocationCity || [];
        const states = trial.LocationState || [];

        const locations = [];
        for (
          let i = 0;
          i < countries.length && totalLocations < MAX_LOCATIONS;
          i++
        ) {
          if (cities[i]) {
            const country = countries[i] || "";
            const state = states[i] || "";
            const city = cities[i];

            // Apply location filter if it exists
            if (locationFilter) {
              const locationString =
                `${city}, ${state}, ${country}`.toLowerCase();
              if (!locationString.includes(locationFilter.toLowerCase())) {
                continue; // Skip this location if it doesn't match the filter
              }
            }

            locations.push({
              city: city,
              state: state,
              country: country,
            });
          }
        }

        // Remove duplicates
        const uniqueLocations = locations.filter(
          (location, index, self) =>
            index ===
            self.findIndex(
              (l) =>
                l.city === location.city &&
                l.state === location.state &&
                l.country === location.country
            )
        );

        totalLocations += uniqueLocations.length;
        if (totalLocations >= MAX_LOCATIONS) {
          totalLocations = MAX_LOCATIONS;
          break;
        }
      }

      setGeocodingProgress({ current: 0, total: totalLocations });

      for (const trial of trials) {
        // Stop if we've hit our location limit
        if (processedLocations >= MAX_LOCATIONS) {
          break;
        }

        const countries = trial.LocationCountry || [];
        const states = trial.LocationState || [];
        const cities = trial.LocationCity || [];
        const facilities = trial.LocationFacility || [];
        const zipCodes = trial.LocationZip || [];
        const statuses = trial.LocationStatus || [];

        // Create unique locations for this trial
        const locations = [];
        for (let i = 0; i < countries.length; i++) {
          if (cities[i]) {
            const country = countries[i] || "";
            const state = states[i] || "";
            const city = cities[i];

            // Apply location filter if it exists
            if (locationFilter) {
              const locationString =
                `${city}, ${state}, ${country}`.toLowerCase();
              if (!locationString.includes(locationFilter.toLowerCase())) {
                continue; // Skip this location if it doesn't match the filter
              }
            }

            locations.push({
              city: city,
              state: state,
              country: country,
              facility: facilities[i] || "",
              zipCode: zipCodes[i] || "",
              status: statuses[i] || trial.OverallStatus?.[0] || "Unknown",
              index: i,
            });
          }
        }

        // Remove duplicates based on city, state, country
        const uniqueLocations = locations.filter(
          (location, index, self) =>
            index ===
            self.findIndex(
              (l) =>
                l.city === location.city &&
                l.state === location.state &&
                l.country === location.country
            )
        );

        // Geocode each unique location with rate limiting
        for (const location of uniqueLocations) {
          // Stop if we've hit our location limit
          if (processedLocations >= MAX_LOCATIONS) {
            break;
          }

          processedLocations++;
          setGeocodingProgress({
            current: processedLocations,
            total: totalLocations,
          });

          // Add delay between requests to avoid rate limiting
          if (processedLocations > 1) {
            await new Promise((resolve) => setTimeout(resolve, 100)); // 100ms delay
          }

          const coordinates = await geocodeLocation(location);
          if (coordinates) {
            successfulGeocoding++;
            allMarkers.push({
              position: coordinates,
              trial: trial,
              location: location,
              id: `${trial.NCTId?.[0]}-${location.city}-${location.state}`,
            });
          } else {
          }
        }
      }

      // Only update markers if they actually changed
      setMarkers((prevMarkers) => {
        if (prevMarkers.length !== allMarkers.length) {
          return allMarkers;
        }
        // Check if marker IDs are different
        const prevIds = new Set(prevMarkers.map((m) => m.id));
        const newIds = new Set(allMarkers.map((m) => m.id));
        const hasChanged =
          prevIds.size !== newIds.size ||
          [...prevIds].some((id) => !newIds.has(id));

        if (hasChanged) {
          return allMarkers;
        } else {
          return prevMarkers;
        }
      });

      // Set map bounds to show all markers or default view
      if (map && allMarkers.length > 0) {
        const bounds = new window.google.maps.LatLngBounds();
        allMarkers.forEach((marker) => {
          bounds.extend(marker.position);
        });
        map.fitBounds(bounds);

        // Ensure minimum zoom level
        const listener = window.google.maps.event.addListener(
          map,
          "bounds_changed",
          () => {
            if (map.getZoom() > 15) {
              map.setZoom(15);
            }
            window.google.maps.event.removeListener(listener);
          }
        );
      } else if (map && allMarkers.length === 0) {
        // Set default view if no markers
        map.setCenter({ lat: 39.8283, lng: -98.5795 });
        map.setZoom(4);
      }

      // Reset processing flag
      processingRef.current = false;
      setIsGeocoding(false);
    };

    processTrials();
  }, [trials, geocoder, map, geocodeLocation, locationFilter]);

  const handleBoundsChanged = useCallback(() => {
    if (!map) return;
    const bounds = map.getBounds();
    if (bounds) {
      onBoundsChanged?.(bounds);
    }
  }, [map, onBoundsChanged]);

  useEffect(() => {
    if (!map) return;
    const listener = map.addListener("bounds_changed", handleBoundsChanged);
    return () => {
      if (window.google?.maps?.event) {
        window.google.maps.event.removeListener(listener);
      }
    };
  }, [map, handleBoundsChanged]);

  const handleMarkerClick = (marker) => {
    setSelectedMarker(marker);
    onMarkerClick?.(marker.trial, marker.location);
  };

  const getTrialUrl = (nctId) =>
    `https://clinicaltrials.gov/study/${nctId}?tab=details`;

  // Get status color for marker with selection state
  const getMarkerIcon = (status, isSelected = false) => {
    const statusLower = status?.toLowerCase() || "";

    let fillColor, strokeColor;

    if (statusLower.includes("recruiting")) {
      fillColor = "#10B981";
      strokeColor = "#065F46";
    } else if (statusLower.includes("active")) {
      fillColor = "#3B82F6";
      strokeColor = "#1E40AF";
    } else if (statusLower.includes("completed")) {
      fillColor = "#8B5CF6";
      strokeColor = "#5B21B6";
    } else {
      fillColor = "#6B7280";
      strokeColor = "#374151";
    }

    // Modify appearance if selected
    if (isSelected) {
      strokeColor = "#F59E0B";
      return {
        url:
          "data:image/svg+xml;charset=UTF-8," +
          encodeURIComponent(`
          <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" fill="${fillColor}" stroke="${strokeColor}" stroke-width="3"/>
            <circle cx="12" cy="12" r="4" fill="white"/>
            <path d="M9 12l2 2 4-4" stroke="${strokeColor}" stroke-width="2" fill="none"/>
          </svg>
        `),
        scaledSize: new window.google.maps.Size(24, 24),
      };
    }

    return {
      url:
        "data:image/svg+xml;charset=UTF-8," +
        encodeURIComponent(`
        <svg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
          <circle cx="10" cy="10" r="8" fill="${fillColor}" stroke="${strokeColor}" stroke-width="2"/>
          <circle cx="10" cy="10" r="3" fill="white"/>
        </svg>
      `),
      scaledSize: new window.google.maps.Size(20, 20),
    };
  };

  // Check if trial is selected
  const isTrialSelected = (trial) => {
    return selectedTrials.some(
      (selected) => selected.NCTId?.[0] === trial.NCTId?.[0]
    );
  };

  if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
    console.error("Google Maps API key not found in environment variables");
    return (
      <div className="h-full w-full flex items-center justify-center bg-gray-100 rounded-lg">
        <p className="text-gray-500">
          Map configuration error - Google Maps API key required
        </p>
      </div>
    );
  }

  return (
    <div className="w-full h-full rounded-lg overflow-hidden relative">
      <GoogleMap
        mapContainerClassName="w-full h-full"
        zoom={4}
        center={{ lat: 39.8283, lng: -98.5795 }}
        options={mapOptions}
        onLoad={handleMapLoad}
      >
        {markers.map((marker) => {
          return (
            <Marker
              key={marker.id}
              position={marker.position}
              title={`${marker.trial.BriefTitle?.[0]} - ${marker.location.city}`}
              icon={getMarkerIcon(
                marker.location.status,
                selectionMode && isTrialSelected(marker.trial)
              )}
              onClick={() => handleMarkerClick(marker)}
            />
          );
        })}

        {selectedMarker && (
          <InfoWindow
            position={selectedMarker.position}
            onCloseClick={() => setSelectedMarker(null)}
          >
            <div className="max-w-sm">
              <div className="mb-2">
                <h3 className="font-semibold text-gray-900 text-sm mb-1">
                  {selectedMarker.trial.BriefTitle?.[0] || "Untitled Trial"}
                </h3>
                <p className="text-xs text-gray-600 mb-2">
                  {selectedMarker.trial.NCTId?.[0]}
                </p>
              </div>

              <div className="space-y-1 text-xs text-gray-600 mb-3">
                <div className="flex items-start">
                  <FaMapMarkerAlt className="mr-1 mt-0.5 text-gray-400 flex-shrink-0" />
                  <div>
                    {selectedMarker.location.facility && (
                      <div className="font-medium">
                        {selectedMarker.location.facility}
                      </div>
                    )}
                    <div>
                      {[
                        selectedMarker.location.city,
                        selectedMarker.location.state,
                        selectedMarker.location.country,
                      ]
                        .filter(Boolean)
                        .join(", ")}
                    </div>
                    {selectedMarker.location.status && (
                      <div className="mt-1">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            selectedMarker.location.status
                              .toLowerCase()
                              .includes("recruiting")
                              ? "bg-green-100 text-green-800"
                              : selectedMarker.location.status
                                  .toLowerCase()
                                  .includes("active")
                              ? "bg-blue-100 text-blue-800"
                              : selectedMarker.location.status
                                  .toLowerCase()
                                  .includes("completed")
                              ? "bg-purple-100 text-purple-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {selectedMarker.location.status}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {selectedMarker.trial.Condition?.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs text-gray-600">
                    <span className="font-medium">Condition:</span>{" "}
                    {selectedMarker.trial.Condition.slice(0, 2).join(", ")}
                    {selectedMarker.trial.Condition.length > 2 && "..."}
                  </p>
                </div>
              )}

              <div className="flex gap-2">
                <a
                  href={getTrialUrl(selectedMarker.trial.NCTId?.[0])}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  <FaExternalLinkAlt className="mr-1" size={10} />
                  ClinicalTrials.gov
                </a>
                {onTrialSelect && (
                  <button
                    onClick={() => onTrialSelect(selectedMarker.trial)}
                    className="inline-flex items-center px-2 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700"
                  >
                    <FaEye className="mr-1" size={10} />
                    Details
                  </button>
                )}
                {selectionMode && onTrialToggleSelect && (
                  <button
                    onClick={() => onTrialToggleSelect(selectedMarker.trial)}
                    className={`inline-flex items-center px-2 py-1 text-xs rounded ${
                      isTrialSelected(selectedMarker.trial)
                        ? "bg-amber-600 text-white hover:bg-amber-700"
                        : "bg-green-600 text-white hover:bg-green-700"
                    }`}
                  >
                    {isTrialSelected(selectedMarker.trial)
                      ? "Deselect"
                      : "Select"}
                  </button>
                )}
              </div>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>

      {/* Geocoding Loading Overlay */}
      {isGeocoding && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm mx-4">
            <div className="flex items-center mb-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-3"></div>
              <h3 className="text-lg font-medium text-gray-900">
                Loading Map Locations
              </h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Geocoding trial locations for map display...
              {locationFilter && (
                <span className="block mt-1 text-blue-600 font-medium">
                  Filtering locations matching {locationFilter}
                </span>
              )}
            </p>
            <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${
                    geocodingProgress.total > 0
                      ? (geocodingProgress.current / geocodingProgress.total) *
                        100
                      : 0
                  }%`,
                }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 text-center">
              {geocodingProgress.current} of {geocodingProgress.total} locations
              processed
            </p>
          </div>
        </div>
      )}

      {/* Debug info */}
      {markers.length > 0 && !isGeocoding && (
        <div className="absolute bottom-2 left-2 bg-white bg-opacity-90 rounded px-2 py-1 text-xs text-gray-600">
          {markers.length} markers displayed
        </div>
      )}
    </div>
  );
};

export default TrialMapView;
