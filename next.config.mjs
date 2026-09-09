/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["sharp", "playwright", "@prisma/client"],
  images: { unoptimized: true },
};

export default nextConfig;
