"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

// Dynamically import the actual map implementation to avoid SSR issues
const MapImplementation = dynamic(() => import("./MapImplementation"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-64 bg-slate-100 rounded-xl animate-pulse flex items-center justify-center border border-slate-200">
      <div className="flex flex-col items-center text-slate-400">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-400 rounded-full animate-spin mb-2"></div>
        <span className="text-sm font-medium">Loading Interactive Map...</span>
      </div>
    </div>
  ),
});

interface MapSelectorProps {
  onLocationSelect: (location: string, details?: any) => void;
  initialLocation?: string;
}

export function MapSelector({ onLocationSelect, initialLocation }: MapSelectorProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return <MapImplementation onLocationSelect={onLocationSelect} initialLocation={initialLocation} />;
}
