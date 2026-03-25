import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function parseLocation(location: [string, string]): [number, number] | null {
  const lat = parseFloat(location[0]);
  const lng = parseFloat(location[1]);
  if (isNaN(lat) || isNaN(lng)) return null;
  return [lat, lng];
}

export function mapsUrl(location: [string, string]): string {
  const coords = parseLocation(location);
  if (!coords) return "#";
  return `https://yandex.uz/maps/?rtext=~${coords[0]},${coords[1]}&rtt=auto`;
}
