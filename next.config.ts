import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export', // Genera HTML/CSS/JS estáticos para la ventana de escritorio
  images: {
    unoptimized: true, // Requerido para apps de escritorio
  },
};

export default nextConfig;