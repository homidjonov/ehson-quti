import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { parseLocation } from "../lib/utils";
import type { Box } from "../types";
import { useEffect } from "react";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const SATELLITE_TILE = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
const SATELLITE_ATTR = "Tiles &copy; Esri";

const COLOR_PRIMARY = "#2da882";
const COLOR_EMPTY = "#94a3b8";

function pinIcon(color: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 40" width="28" height="40">
    <path fill="${color}" stroke="white" stroke-width="1.5" d="M14 0C6.3 0 0 6.3 0 14c0 10.5 14 26 14 26s14-15.5 14-26C28 6.3 21.7 0 14 0z"/>
    <circle fill="white" cx="14" cy="14" r="5"/>
  </svg>`;
  return L.divIcon({
    html: svg,
    className: "",
    iconSize: [28, 40],
    iconAnchor: [14, 40],
    popupAnchor: [0, -40],
  });
}

function RecenterMap({ center, zoom }: { center: [number, number]; zoom?: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom ?? map.getZoom());
  }, [center, map]);
  return null;
}

function MapClickHandler({ onLocationChange }: { onLocationChange: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onLocationChange(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// Boxes list map
interface BoxesMapProps {
  boxes: Box[];
  onSelect: (box: Box) => void;
  userLocation?: [number, number] | null;
  fallbackCenter?: [number, number];
}

export function BoxesMap({ boxes, onSelect, userLocation, fallbackCenter }: BoxesMapProps) {
  const initialCenter: [number, number] = userLocation ?? fallbackCenter ?? [41.2995, 69.2401];
  const initialZoom = userLocation ? 15 : 12;

  return (
    <MapContainer
      center={initialCenter}
      zoom={initialZoom}
      style={{ height: "100%", width: "100%" }}
    >
      {userLocation && <RecenterMap center={userLocation} zoom={15} />}
      <TileLayer attribution={SATELLITE_ATTR} url={SATELLITE_TILE} />
      {boxes.map((box) => {
        const coords = parseLocation(box.location);
        if (!coords) return null;
        return (
          <Marker
            key={box.id}
            position={coords}
            icon={pinIcon(box.is_empty ? COLOR_EMPTY : COLOR_PRIMARY)}
            eventHandlers={{ click: () => onSelect(box) }}
          />
        );
      })}
    </MapContainer>
  );
}

// Single box detail map
interface SingleBoxMapProps {
  location: [string, string];
  zoom?: number;
}

export function SingleBoxMap({ location, zoom = 16 }: SingleBoxMapProps) {
  const coords = parseLocation(location);
  if (!coords) return null;

  return (
    <MapContainer
      center={coords}
      zoom={zoom}
      style={{ height: "100%", width: "100%" }}
      dragging={false}
      scrollWheelZoom={false}
      doubleClickZoom={false}
      zoomControl={false}
    >
      <TileLayer attribution={SATELLITE_ATTR} url={SATELLITE_TILE} />
      <Marker position={coords} icon={pinIcon(COLOR_PRIMARY)} />
    </MapContainer>
  );
}

// Interactive location picker map for AddBox
interface LocationPickerMapProps {
  location: [number, number] | null;
  onLocationChange: (lat: number, lng: number) => void;
}

export function LocationPickerMap({ location, onLocationChange }: LocationPickerMapProps) {
  const center: [number, number] = location ?? [41.2995, 69.2401];

  return (
    <MapContainer
      center={center}
      zoom={16}
      style={{ height: "100%", width: "100%" }}
    >
      {location && <RecenterMap center={location} />}
      <TileLayer attribution={SATELLITE_ATTR} url={SATELLITE_TILE} />
      <MapClickHandler onLocationChange={onLocationChange} />
      {location && <Marker position={location} icon={pinIcon(COLOR_PRIMARY)} />}
    </MapContainer>
  );
}
