import type { NextConfig } from "next";
// @ts-expect-error next-pwa doesn't have official TS support for the latest Next.js yet
import withPWAInit from "next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development", // PWA hanya aktif saat di-build/production agar tidak mengganggu saat koding
  register: true,
  skipWaiting: true,
});

const nextConfig: NextConfig = {
  // Tambahkan config next lainnya di sini jika ada
};

export default withPWA(nextConfig);