import {
  GoogleMap,
  LoadScript,
  Marker,
  InfoWindow,
} from "@react-google-maps/api";
import { useState, useEffect, useCallback } from "react";

const Map = ({ events, selectedEvent, onBoundsChanged, onMarkerClick }) => {
  const [markers, setMarkers] = useState([]);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [map, setMap] = useState(null);
  const [geocoder, setGeocoder] = useState(null);

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
    async (event) => {
      if (!geocoder || !event.locationCity) return null;

      // Build address string including country if available
      let address = event.locationCity;
      if (event.locationState) {
        address += `, ${event.locationState}`;
      }
      if (event.locationCountry) {
        address += `, ${event.locationCountry}`;
      }

      try {
        const result = await new Promise((resolve, reject) => {
          geocoder.geocode(
            {
              address,
              // Optionally bias results to a specific country
              componentRestrictions: event.locationCountry
                ? { country: event.locationCountry.toLowerCase() }
                : undefined,
            },
            (results, status) => {
              if (status === "OK") {
                resolve(results[0]);
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
        console.error(`Geocoding error for ${address}:`, error);
        return null;
      }
    },
    [geocoder]
  );

  // Handle map load success
  const handleMapLoad = (mapInstance) => {
    setMap(mapInstance);
    setGeocoder(new window.google.maps.Geocoder());
  };

  useEffect(() => {
    if (!events || !geocoder) return;

    const processEvents = async () => {
      const validEvents = events.filter(
        (event) => event.locationCity // Only require city
      );

      const markersPromises = validEvents.map(async (event) => {
        const coordinates = await geocodeLocation(event);
        if (coordinates) {
          return {
            position: coordinates,
            title: event.title,
            event: event,
          };
        }
        return null;
      });

      const newMarkers = (await Promise.all(markersPromises)).filter(
        (marker) => marker !== null
      );
      setMarkers(newMarkers);

      // Only set default center if map is not yet initialized
      if (map && !map.getCenter()) {
        // Set default view of continental US
        map.setCenter({ lat: 39.8283, lng: -98.5795 });
        map.setZoom(5);
      }
    };

    processEvents();
  }, [events, geocoder, map, geocodeLocation, onBoundsChanged]);

  const handleBoundsChanged = useCallback(() => {
    if (!map) return;
    const bounds = map.getBounds();
    if (bounds) {
      onBoundsChanged?.(bounds);
    }
  }, [map, onBoundsChanged]);

  useEffect(() => {
    if (!map) return;
    map.addListener("bounds_changed", handleBoundsChanged);
    return () => {
      window.google?.maps?.event.clearListeners(map, "bounds_changed");
    };
  }, [map, handleBoundsChanged]);

  const handleMarkerClick = (marker) => {
    setSelectedMarker(marker);
    onMarkerClick?.(marker.event);
  };

  if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-gray-100 rounded-lg">
        <p className="text-gray-500">Map configuration error</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full rounded-lg overflow-hidden">
      <LoadScript
        googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}
      >
        <GoogleMap
          mapContainerClassName="w-full h-full"
          zoom={5}
          center={{ lat: 39.8283, lng: -98.5795 }}
          options={mapOptions}
          onLoad={handleMapLoad}
        >
          {markers.map((marker, index) => (
            <Marker
              key={`${marker.position.lat}-${marker.position.lng}-${index}`}
              position={marker.position}
              title={marker.title}
              onClick={() => handleMarkerClick(marker)}
            ></Marker>
          ))}
        </GoogleMap>
      </LoadScript>
    </div>
  );
};

export default Map;
