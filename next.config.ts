/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Build-time Netlify metadata is safely baked into server route handlers:
  // some values are unavailable in the runtime Function environment.
  env: {
    PUBLISH_BUILD_CONTEXT: process.env.CONTEXT || 'local',
    PUBLISH_BUILD_PRIME_URL: process.env.DEPLOY_PRIME_URL || process.env.URL || '',
  },
};

export default nextConfig;
