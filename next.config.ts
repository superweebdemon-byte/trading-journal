import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "http://192.168.1.153:3000",
    "http://172.28.50.190:3000",
    "http://172.28.48.1:3000",
    "http://172.21.48.1:3000",
    "http://26.95.201.69:3000",
  ],
};

export default nextConfig;
