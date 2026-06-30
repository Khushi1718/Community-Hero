"use client";

import { useEffect, useState, useRef } from "react";
import Script from "next/script";
import { MapPin, Activity, CheckCircle, Users } from "lucide-react";
import { useTranslation } from "react-i18next";

// Fallback coordinate dictionary for Indian cities
const CITY_COORDINATES: Record<string, [number, number]> = {
  "Rohtak": [28.8955, 76.5816],
  "Delhi": [28.6139, 77.2090],
  "New Delhi": [28.6139, 77.2090],
  "Mumbai": [19.0760, 72.8777],
  "Pune": [18.5204, 73.8567],
  "Hyderabad": [17.3850, 78.4867],
  "Bangalore": [12.9716, 77.5946],
  "Chennai": [13.0827, 80.2707],
  "Kolkata": [22.5726, 88.3639],
  "Ahmedabad": [23.0225, 72.5714],
  "Jaipur": [26.9124, 75.7873],
  "Chandigarh": [30.7333, 76.7794],
  "Lucknow": [26.8467, 80.9462],
  "Bhopal": [23.2599, 77.4126],
  "Patna": [25.5941, 85.1376],
  "Indore": [22.7196, 75.8577],
};

const DEFAULT_CENTER: [number, number] = [20.5937, 78.9629]; // Center of India

const MAP_STYLES = [
  {
    "elementType": "geometry",
    "stylers": [{ "color": "#f8fafc" }] // Slate-50 background
  },
  {
    "elementType": "labels.icon",
    "stylers": [{ "visibility": "off" }] // Hide points of interest to reduce clutter
  },
  {
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#475569" }] // Slate-600 text
  },
  {
    "elementType": "labels.text.stroke",
    "stylers": [{ "color": "#ffffff" }]
  },
  {
    "featureType": "administrative",
    "elementType": "geometry.stroke",
    "stylers": [{ "color": "#cbd5e1" }] // Slate-300 borders
  },
  {
    "featureType": "poi",
    "stylers": [{ "visibility": "off" }]
  },
  {
    "featureType": "road",
    "elementType": "geometry",
    "stylers": [{ "color": "#ffffff" }]
  },
  {
    "featureType": "road",
    "elementType": "geometry.stroke",
    "stylers": [{ "color": "#e2e8f0" }] // Slate-200 road borders
  },
  {
    "featureType": "road.highway",
    "elementType": "geometry",
    "stylers": [{ "color": "#f1f5f9" }]
  },
  {
    "featureType": "road.highway",
    "elementType": "geometry.stroke",
    "stylers": [{ "color": "#cbd5e1" }]
  },
  {
    "featureType": "water",
    "elementType": "geometry",
    "stylers": [{ "color": "#e0f2fe" }] // Light sky blue water
  },
  {
    "featureType": "water",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#0369a1" }]
  }
];

export default function CoverageMap() {
  const { t } = useTranslation();
  const [cities, setCities] = useState<string[]>([]);
  const [adminCount, setAdminCount] = useState(0);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [center, setCenter] = useState<[number, number]>(DEFAULT_CENTER);
  const [zoom, setZoom] = useState(5);
  const [isLoading, setIsLoading] = useState(true);
  const [dynamicCoords, setDynamicCoords] = useState<Record<string, [number, number]>>({});
  const [isSdkLoaded, setIsSdkLoaded] = useState(() => {
    return typeof window !== "undefined" && typeof window.google !== "undefined";
  });
  const [authError, setAuthError] = useState(false);
  const [useLeafletFallback, setUseLeafletFallback] = useState(false);
  const [leafletLoaded, setLeafletLoaded] = useState(false);

  const allCoords = { ...CITY_COORDINATES, ...dynamicCoords };

  const [stats, setStats] = useState({ activeReports: "0", resolvedIssues: "0" });

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);

  const leafletMapRef = useRef<any>(null);
  const leafletMarkersRef = useRef<any[]>([]);

  // Detect Google Maps Authentication Failure
  useEffect(() => {
    (window as any).gm_authFailure = () => {
      console.warn("Google Maps authentication failed. Activating Leaflet fallback options.");
      setAuthError(true);
    };
  }, []);

  useEffect(() => {
    async function fetchMapData() {
      try {
        // Fetch all admins
        const res = await fetch("/api/users?role=admin");
        if (res.ok) {
          const admins = await res.json();
          setAdminCount(admins.length);
          
          // Extract unique cities
          const citySet = new Set<string>();
          admins.forEach((admin: any) => {
            if (admin.city) {
               const cityName = admin.city.trim();
               citySet.add(cityName);
            }
          });
          
          const cityArray = Array.from(citySet);
          setCities(cityArray);
          setIsLoading(false); // Stop loading early

          // Fetch real issue stats in parallel
          fetch("/api/issues").then(res => res.json()).then(issues => {
            let active = 0;
            let resolved = 0;
            if (Array.isArray(issues)) {
              issues.forEach(issue => {
                if (issue.status && ["resolved", "closed", "completed"].includes(issue.status.toLowerCase())) {
                  resolved++;
                } else {
                  active++;
                }
              });
            }
            setStats({
              activeReports: active.toString(),
              resolvedIssues: resolved.toString()
            });
          }).catch(err => console.error("Error fetching stats:", err));

          // Geocode missing cities sequentially to respect Nominatim limits
          const newCoords: Record<string, [number, number]> = {};
          for (const c of cityArray) {
             if (!CITY_COORDINATES[c]) {
                try {
                   const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(c + ', India')}`);
                   const geoData = await geoRes.json();
                   if (geoData && geoData.length > 0) {
                      newCoords[c] = [parseFloat(geoData[0].lat), parseFloat(geoData[0].lon)];
                   }
                } catch (e) { console.error("Geocode failed for", c); }
                // Sleep to avoid rate limiting
                await new Promise(r => setTimeout(r, 1000));
             }
          }
          if (Object.keys(newCoords).length > 0) {
             setDynamicCoords(prev => ({ ...prev, ...newCoords }));
          }
          
          // Auto-select first available city if it exists in our merged coordinates map
          if (cityArray.length > 0) {
             const firstValid = cityArray.find(c => CITY_COORDINATES[c] || newCoords[c]);
             if (firstValid) {
                  const coords = CITY_COORDINATES[firstValid] || newCoords[firstValid];
                  setSelectedCity(firstValid);
                  setCenter(coords);
                  setZoom(7);
             }
          }
        }
      } catch (err) {
        console.error("Error fetching map data", err);
        setIsLoading(false);
      }
    }
    fetchMapData();
  }, []);

  const handleCityClick = (city: string) => {
    setSelectedCity(city);
    const coords = allCoords[city] || DEFAULT_CENTER;
    setCenter(coords);
    setZoom(7);
  };

  const resetMap = () => {
    setSelectedCity(null);
    setCenter(DEFAULT_CENTER);
    setZoom(5);
  };

  // 1. Initialize Google Map
  useEffect(() => {
    if (!isSdkLoaded || !mapContainerRef.current || mapRef.current || useLeafletFallback) return;

    const mapOptions: google.maps.MapOptions = {
      center: { lat: center[0], lng: center[1] },
      zoom: zoom,
      styles: MAP_STYLES,
      disableDefaultUI: false,
      zoomControl: true,
      mapTypeControl: false,
      scaleControl: true,
      streetViewControl: false,
      rotateControl: false,
      fullscreenControl: true,
    };

    const mapInstance = new google.maps.Map(mapContainerRef.current, mapOptions);
    mapRef.current = mapInstance;
    infoWindowRef.current = new google.maps.InfoWindow();
  }, [isSdkLoaded, useLeafletFallback]);

  // 2. Control Google Map position and zoom
  useEffect(() => {
    if (!useLeafletFallback && mapRef.current) {
      mapRef.current.panTo({ lat: center[0], lng: center[1] });
      mapRef.current.setZoom(zoom);
    }
  }, [center, zoom, useLeafletFallback]);

  // 3. Render and update Google Map markers
  useEffect(() => {
    const map = mapRef.current;
    if (useLeafletFallback || !map || !isSdkLoaded) return;

    // Clear existing markers
    markersRef.current.forEach(m => m.setMap(null));
    markersRef.current = [];

    const infoWindow = infoWindowRef.current;

    cities.forEach(city => {
      const coords = allCoords[city];
      if (!coords) return;

      const marker = new google.maps.Marker({
        position: { lat: coords[0], lng: coords[1] },
        map: map,
        title: city,
        icon: {
          path: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z",
          fillColor: "#16a34a",
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 1.5,
          scale: 1.5,
          anchor: new google.maps.Point(12, 22),
        }
      });

      marker.addListener("click", () => {
        if (infoWindow) {
          infoWindow.setContent(`
            <div style="font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; padding: 6px; text-align: center; max-width: 180px;">
              <p style="font-weight: 800; color: #0f172a; margin: 0 0 2px 0; font-size: 14px;">${city}</p>
              <p style="font-size: 11px; color: #64748b; margin: 0 0 8px 0; font-weight: 500;">Municipal Administration Active</p>
              <span style="display: inline-block; padding: 2px 8px; background-color: #dcfce7; color: #15803d; font-size: 10px; font-weight: 700; border-radius: 9999px;">
                Live Verified
              </span>
            </div>
          `);
          infoWindow.open(map, marker);
        }
      });

      markersRef.current.push(marker);
    });

  }, [cities, allCoords, isSdkLoaded, useLeafletFallback]);

  // Leaflet fallback loader function
  const loadLeaflet = () => {
    // Clear any Google Map HTML content first
    if (mapContainerRef.current) {
      mapContainerRef.current.innerHTML = "";
    }
    mapRef.current = null;
    
    if (leafletLoaded) {
      setUseLeafletFallback(true);
      return;
    }
    
    // Inject Leaflet CSS
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(link);

    // Inject Leaflet JS script
    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.onload = () => {
      setLeafletLoaded(true);
      setUseLeafletFallback(true);
    };
    document.head.appendChild(script);
  };

  // Leaflet Map Initialization
  useEffect(() => {
    if (!useLeafletFallback || !leafletLoaded || !mapContainerRef.current || leafletMapRef.current) return;

    const L = (window as any).L;
    if (!L) return;

    const mapInstance = L.map(mapContainerRef.current, {
      center: DEFAULT_CENTER,
      zoom: 5,
      zoomControl: true,
    });

    L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(mapInstance);

    leafletMapRef.current = mapInstance;
  }, [useLeafletFallback, leafletLoaded]);

  // Control Leaflet position and zoom
  useEffect(() => {
    if (useLeafletFallback && leafletMapRef.current) {
      leafletMapRef.current.setView(center, zoom);
    }
  }, [center, zoom, useLeafletFallback]);

  // Update Leaflet markers
  useEffect(() => {
    const map = leafletMapRef.current;
    if (!useLeafletFallback || !map) return;

    const L = (window as any).L;
    if (!L) return;

    // Clear old markers
    leafletMarkersRef.current.forEach(m => m.remove());
    leafletMarkersRef.current = [];

    cities.forEach(city => {
      const coords = allCoords[city];
      if (!coords) return;

      const marker = L.marker(coords).addTo(map);
      marker.bindPopup(`
        <div style="font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; text-align: center; padding: 4px; min-width: 140px;">
          <p style="font-weight: 800; color: #0f172a; margin: 0 0 2px 0; font-size: 14px;">${city}</p>
          <p style="font-size: 11px; color: #64748b; margin: 0 0 8px 0; font-weight: 500;">Municipal Administration Active</p>
          <span style="display: inline-block; padding: 2px 8px; background-color: #dcfce7; color: #15803d; font-size: 10px; font-weight: 700; border-radius: 9999px;">
            Live Verified
          </span>
        </div>
      `);
      leafletMarkersRef.current.push(marker);
    });
  }, [cities, allCoords, useLeafletFallback, leafletLoaded]);

  if (isLoading) {
    return <div className="w-full h-[500px] flex items-center justify-center bg-slate-50 rounded-3xl animate-pulse text-green-600 font-bold">Loading Live Map...</div>;
  }

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  return (
    <div className="flex flex-col gap-6">
      {/* Script Loader */}
      {apiKey && (
        <Script
          src={`https://maps.googleapis.com/maps/api/js?key=${apiKey}`}
          onLoad={() => setIsSdkLoaded(true)}
        />
      )}

      {/* City Toggles */}
      <div className="flex flex-wrap items-center gap-2">
        <button 
          onClick={resetMap}
          className={`px-4 py-2 rounded-full text-sm font-bold transition-colors ${selectedCity === null ? 'bg-green-600 text-white shadow-md' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
        >
          All India View
        </button>
        {cities.map(city => (
          <button
            key={city}
            onClick={() => handleCityClick(city)}
            className={`px-4 py-2 rounded-full text-sm font-bold transition-colors ${selectedCity === city ? 'bg-green-600 text-white shadow-md' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
            disabled={!allCoords[city]} // Disable if we don't have coordinates
            title={!allCoords[city] ? "Location data unavailable" : ""}
          >
            <MapPin className="w-3 h-3 inline-block mr-1.5" />
            {city}
          </button>
        ))}
        {cities.length === 0 && (
           <span className="text-sm text-slate-500 italic px-2">No active cities found.</span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Stats Panel */}
        <div className="lg:col-span-1 flex flex-col gap-4">
           <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
             <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center text-green-600 shrink-0">
               <MapPin className="w-6 h-6" />
             </div>
             <div>
               <p className="text-3xl font-black text-slate-900 leading-none">{cities.length}</p>
               <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">{t("home.coverage.activeCities", "Active Cities")}</p>
             </div>
           </div>
           
           <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
             <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 shrink-0">
               <Users className="w-6 h-6" />
             </div>
             <div>
               <p className="text-3xl font-black text-slate-900 leading-none">{adminCount}</p>
               <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">{t("home.coverage.registeredAdmins", "Registered Admins")}</p>
             </div>
           </div>

           <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
             <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600 shrink-0">
               <Activity className="w-6 h-6" />
             </div>
             <div>
               <p className="text-3xl font-black text-slate-900 leading-none">{stats.activeReports}</p>
               <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">{t("home.coverage.activeReports", "Active Reports")}</p>
             </div>
           </div>

           <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
             <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 shrink-0">
               <CheckCircle className="w-6 h-6" />
             </div>
             <div>
               <p className="text-3xl font-black text-slate-900 leading-none">{stats.resolvedIssues}</p>
               <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">{t("home.coverage.resolvedIssues", "Resolved Issues")}</p>
             </div>
           </div>
        </div>

        {/* The Map */}
        <div className="lg:col-span-3 h-[500px] w-full rounded-3xl overflow-hidden shadow-lg border border-slate-200 z-0 relative bg-slate-100">
          <div ref={mapContainerRef} style={{ height: '100%', width: '100%' }} />
          {!isSdkLoaded && !authError && !useLeafletFallback && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-50 text-green-600 font-bold animate-pulse">
              Loading Google Maps...
            </div>
          )}
          {authError && !useLeafletFallback && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50 p-8 text-center">
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mb-4">
                <MapPin className="w-8 h-8 text-red-600" />
              </div>
              <h4 className="text-lg font-bold text-slate-900 mb-2">Google Maps Authorization Error</h4>
              <p className="text-sm text-slate-500 max-w-md mb-6 leading-relaxed">
                The Google Maps API key has referrer restrictions that block <code className="bg-slate-100 px-1.5 py-0.5 rounded text-red-600 font-mono">http://localhost:3000/</code>. Please authorize this referrer in Google Cloud Console.
              </p>
              <div className="flex flex-wrap gap-3 justify-center">
                <a 
                  href="https://console.cloud.google.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-bold rounded-xl shadow-sm transition-colors cursor-pointer"
                >
                  Configure API Key
                </a>
                <button
                  onClick={loadLeaflet}
                  className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-sm font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Use Leaflet Fallback
                </button>
              </div>
            </div>
          )}
          {!apiKey && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-50 text-red-600 font-bold">
              Google Maps API Key not configured.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
