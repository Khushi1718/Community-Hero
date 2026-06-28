"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
import { MapPin, Activity, CheckCircle, Users } from "lucide-react";

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

function MapController({ center, zoom }: { center: [number, number], zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom, { duration: 1.5 });
  }, [center, zoom, map]);
  return null;
}

export default function CoverageMap() {
  const [cities, setCities] = useState<string[]>([]);
  const [adminCount, setAdminCount] = useState(0);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [center, setCenter] = useState<[number, number]>(DEFAULT_CENTER);
  const [zoom, setZoom] = useState(5);
  const [isLoading, setIsLoading] = useState(true);
  const [dynamicCoords, setDynamicCoords] = useState<Record<string, [number, number]>>({});

  const allCoords = { ...CITY_COORDINATES, ...dynamicCoords };

  const [stats, setStats] = useState({ activeReports: "0", resolvedIssues: "0" });

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
                if (issue.status === "resolved" || issue.status === "Resolved") {
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

  if (isLoading) {
    return <div className="w-full h-[500px] flex items-center justify-center bg-slate-50 rounded-3xl animate-pulse text-green-600 font-bold">Loading Live Map...</div>;
  }

  return (
    <div className="flex flex-col gap-6">
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
               <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">Active Cities</p>
             </div>
           </div>
           
           <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
             <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 shrink-0">
               <Users className="w-6 h-6" />
             </div>
             <div>
               <p className="text-3xl font-black text-slate-900 leading-none">{adminCount}</p>
               <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">Registered Admins</p>
             </div>
           </div>

           <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
             <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600 shrink-0">
               <Activity className="w-6 h-6" />
             </div>
             <div>
               <p className="text-3xl font-black text-slate-900 leading-none">{stats.activeReports}</p>
               <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">Active Reports</p>
             </div>
           </div>

           <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
             <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 shrink-0">
               <CheckCircle className="w-6 h-6" />
             </div>
             <div>
               <p className="text-3xl font-black text-slate-900 leading-none">{stats.resolvedIssues}</p>
               <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">Resolved Issues</p>
             </div>
           </div>
        </div>

        {/* The Map */}
        <div className="lg:col-span-3 h-[500px] w-full rounded-3xl overflow-hidden shadow-lg border border-slate-200 z-0">
          <MapContainer 
            center={DEFAULT_CENTER} 
            zoom={5} 
            scrollWheelZoom={false}
            style={{ height: '100%', width: '100%', zIndex: 0 }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            />
            <MapController center={center} zoom={zoom} />
            
            {cities.map(city => {
               const coords = allCoords[city];
               if (!coords) return null;
               return (
                 <Marker key={city} position={coords}>
                   <Popup className="font-sans">
                      <div className="text-center p-1">
                        <p className="font-black text-slate-900 mb-1">{city}</p>
                        <p className="text-xs text-slate-500 mb-2">Municipal Administration Active</p>
                        <span className="inline-block px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded-full">
                          Live Verified
                        </span>
                      </div>
                   </Popup>
                 </Marker>
               )
            })}
          </MapContainer>
        </div>
      </div>
    </div>
  );
}
