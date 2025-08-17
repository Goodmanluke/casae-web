/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // Removed automatic redirect from "/" to "/login" to allow
  // the home page (address input) to be reachable. If you wish
  // to protect routes, implement that logic inside pages or via
  // middleware.
};

module.exports = nextConfig;