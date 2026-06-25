"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import "leaflet-defaulticon-compatibility";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";

import { GeoSearchControl, EsriProvider } from "leaflet-geosearch";
import "leaflet-geosearch/dist/geosearch.css";

interface MapImplementationProps {
  onLocationSelect: (location: string, addressDetails?: any) => void;
  initialLocation?: string;
}

function LocationMarker({ position, setPosition, onLocationSelect }: { position: L.LatLng | null, setPosition: (p: L.LatLng) => void, onLocationSelect: (loc: string) => void }) {
  useMapEvents({
    click(e) {
      setPosition(e.latlng);
      onLocationSelect(`${e.latlng.lat.toFixed(6)}, ${e.latlng.lng.toFixed(6)}`);
    },
  });

  return position === null ? null : (
    <Marker position={position}></Marker>
  );
}

// Component to handle the Geosearch control
function GeosearchComponent({ setPosition, onLocationSelect }: { setPosition: (p: L.LatLng) => void, onLocationSelect: (loc: string, details?: any) => void }) {
  const map = useMap();

  useEffect(() => {
    const provider = new EsriProvider();

    const searchControl = new (GeoSearchControl as any)({
      provider: provider,
      style: "bar",
      showMarker: false,
      showPopup: false,
      autoClose: true,
      retainZoomLevel: false,
      animateZoom: true,
      keepResult: true,
      searchLabel: "Search for colony or exact address...",
    });

    map.addControl(searchControl);

    // Listen to the geosearch showlocation event
    const handleLocationFound = (e: any) => {
      if (e.location && e.location.x && e.location.y) {
        const latLng = new L.LatLng(e.location.y, e.location.x);
        setPosition(latLng);
        // We can pass the raw label back to help fill out address fields
        onLocationSelect(`${e.location.y.toFixed(6)}, ${e.location.x.toFixed(6)}`, e.location.label);
      }
    };

    map.on("geosearch/showlocation", handleLocationFound);

    return () => {
      map.removeControl(searchControl);
      map.off("geosearch/showlocation", handleLocationFound);
    };
  }, [map, setPosition, onLocationSelect]);

  return null;
}

export default function MapImplementation({ onLocationSelect, initialLocation }: MapImplementationProps) {
  const [position, setPosition] = useState<L.LatLng | null>(null);
  const [center, setCenter] = useState<[number, number]>([28.7041, 77.1025]);

  useEffect(() => {
    if (initialLocation) {
      const parts = initialLocation.split(",");
      if (parts.length === 2) {
        const lat = parseFloat(parts[0]);
        const lng = parseFloat(parts[1]);
        if (!isNaN(lat) && !isNaN(lng)) {
          const latLng = new L.LatLng(lat, lng);
          setCenter([lat, lng]);
          setPosition(latLng);
        }
      }
    }
  }, [initialLocation]);

  const handleGetCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const latLng = new L.LatLng(pos.coords.latitude, pos.coords.longitude);
          setCenter([pos.coords.latitude, pos.coords.longitude]);
          setPosition(latLng);
          onLocationSelect(`${pos.coords.latitude.toFixed(6)}, ${pos.coords.longitude.toFixed(6)}`);
        },
        () => alert("Unable to retrieve your location")
      );
    } else {
      alert("Geolocation not supported");
    }
  };

  return (
    <div className="relative w-full h-[400px] rounded-xl overflow-hidden border border-slate-200 shadow-inner group z-0">
      <style dangerouslySetInnerHTML={{__html: `
        .leaflet-control-geosearch form {
          background: white !important;
          border-radius: 12px !important;
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1) !important;
          padding: 4px;
        }
        .leaflet-control-geosearch input {
          height: 40px !important;
          border-radius: 8px !important;
          border: none !important;
          padding-left: 12px !important;
          font-family: inherit !important;
        }
        .leaflet-control-geosearch form input:focus {
          outline: none !important;
          box-shadow: none !important;
        }
        .leaflet-control-geosearch a.reset {
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .leaflet-control-geosearch .results {
          background: white !important;
          border-radius: 12px !important;
          box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1) !important;
          margin-top: 8px !important;
          border: 1px solid #e2e8f0;
          overflow: hidden;
        }
        .leaflet-control-geosearch .results > * {
          padding: 10px 16px !important;
          font-size: 14px;
          border-bottom: 1px solid #f1f5f9;
        }
        .leaflet-control-geosearch .results > *:last-child {
          border-bottom: none;
        }
        .leaflet-control-geosearch .results > *:hover {
          background-color: #f8fafc !important;
          border-color: #f1f5f9 !important;
        }
      `}} />
      <MapContainer center={center} zoom={13} scrollWheelZoom={false} className="w-full h-full z-0">
        <GeosearchComponent setPosition={setPosition} onLocationSelect={onLocationSelect} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LocationMarker position={position} setPosition={setPosition} onLocationSelect={onLocationSelect} />
      </MapContainer>
      <button
        type="button"
        onClick={handleGetCurrentLocation}
        className="absolute bottom-6 right-4 z-[400] bg-white text-blue-600 font-bold px-4 py-2 rounded-full shadow-lg border border-slate-100 hover:bg-slate-50 transition-colors"
      >
        Use My Location
      </button>
      {!position && (
        <div className="absolute top-6 right-4 z-[400] bg-white/90 backdrop-blur-sm text-slate-800 text-sm font-medium px-4 py-2 rounded-lg shadow-sm border border-slate-100 pointer-events-none">
          Click on the map or search to set location
        </div>
      )}
    </div>
  );
}
