import type { NextConfig } from "next";

// Izinkan dev-server diakses dari perangkat lain di LAN (misal: 192.168.1.*).
// Nilai dibaca dari ALLOWED_DEV_ORIGINS (comma-separated), default kosong agar tidak membocorkan IP internal.
const allowedDevOrigins = process.env.ALLOWED_DEV_ORIGINS
  ? process.env.ALLOWED_DEV_ORIGINS.split(',').map((s) => s.trim()).filter(Boolean)
  : [];

const nextConfig: NextConfig = {
  ...(allowedDevOrigins.length > 0 ? { allowedDevOrigins } : {}),
};

export default nextConfig;
