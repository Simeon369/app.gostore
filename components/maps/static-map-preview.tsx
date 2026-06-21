"use client";

import { getDirectionsUrl } from "@/lib/geo";
import { MapPin, Navigation } from "lucide-react";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

const customIcon = typeof window !== 'undefined' ? new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
}) : null;


interface StaticMapPreviewProps {
  lat: number;
  lng: number;
  address?: string;
  showDirections?: boolean;
  className?: string;
}

export function StaticMapPreview({
  lat,
  lng,
  address,
  showDirections = true,
  className = "",
}: StaticMapPreviewProps) {
  const directionsUrl = getDirectionsUrl(lat, lng);

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      {address && (
        <div className="flex items-start gap-2 text-sm text-muted-foreground">
          <MapPin className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
          <span className="leading-relaxed">{address}</span>
        </div>
      )}
      <div className="relative w-full h-40 rounded-2xl overflow-hidden border border-border bg-muted">
        <MapContainer
          center={[lat, lng]}
          zoom={15}
          scrollWheelZoom={false}
          style={{ width: "100%", height: "100%", zIndex: 0 }}
          attributionControl={false}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {customIcon && <Marker position={[lat, lng]} icon={customIcon} />}
        </MapContainer>
      </div>
      {showDirections && (
        <a
          href={directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-xs font-bold text-primary hover:underline"
        >
          <Navigation className="w-3.5 h-3.5" />
          Get directions
        </a>
      )}
    </div>
  );
}
