/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // Ignore optional pino dependencies that cause build errors
    config.externals.push('pino-pretty', 'lokijs', 'encoding');

    // Fix for WalletConnect and other crypto libraries
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };

      // Ignore React Native dependencies
      config.resolve.alias = {
        ...config.resolve.alias,
        '@react-native-async-storage/async-storage': false,
      };
    }

    return config;
  },
};

export default nextConfig;
