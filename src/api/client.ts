import type { Box, BoxImage, VerifyResponse } from "../types";
import { useAuthStore } from "../store/authStore";

const BASE_URL = "https://api.mehrli.uz/v1/quti";

async function throwError(res: Response, fallback: string): Promise<never> {
  if (res.status === 429) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.message ?? "Juda ko'p so'rov yuborildi");
  }
  throw new Error(fallback);
}

function authHeaders(): Record<string, string> {
  const apiKey = useAuthStore.getState().apiKey;
  if (!apiKey) return {};
  return { "X-Api-Key": apiKey };
}

export async function verifyPin(pin: string): Promise<VerifyResponse> {
  const res = await fetch(`${BASE_URL}/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `pin=${encodeURIComponent(pin)}`,
  });
  if (!res.ok) await throwError(res, "Noto'g'ri PIN kod");
  return res.json();
}

export async function fetchBoxes(): Promise<Box[]> {
  const res = await fetch(`${BASE_URL}/list`);
  if (!res.ok) await throwError(res, "Ro'yxatni yuklashda xato");
  const data = await res.json();
  return data.items ?? [];
}

export async function uploadImage(file: File): Promise<BoxImage[]> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${BASE_URL}/upload`, {
    method: "POST",
    headers: authHeaders(),
    body: formData,
  });
  if (!res.ok) await throwError(res, "Rasm yuklashda xato");
  const data = await res.json();
  return data.files ?? [];
}

export async function createBox(data: {
  number: number;
  location: string;
  images: BoxImage[];
}): Promise<Box> {
  const res = await fetch(`${BASE_URL}/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(data),
  });
  if (!res.ok) await throwError(res, "Quti yaratishda xato");
  return res.json();
}

export async function setBoxEmpty(id: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/set-empty?id=${id}`, {
    headers: authHeaders(),
  });
  if (!res.ok) await throwError(res, "Statusni o'zgartirishda xato");
}

export async function removeBox(id: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/remove?id=${id}`, {
    headers: authHeaders(),
  });
  if (!res.ok) await throwError(res, "Qutini o'chirishda xato");
}
