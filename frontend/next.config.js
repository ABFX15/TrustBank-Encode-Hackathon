/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: {
        esmExternals: 'loose'
    },
    webpack: (config, { isServer }) => {
        config.resolve.fallback = { fs: false, net: false, tls: false };
        config.externals.push('pino-pretty', 'lokijs', 'encoding');

        // Ignore problematic worker files
        config.ignoreWarnings = [
            /HeartbeatWorker/,
            /Failed to parse input file/,
        ];

        // Exclude problematic worker files from build
        config.module.rules.push({
            test: /HeartbeatWorker\.js$/,
            use: 'null-loader'
        });

        // Handle ES module compatibility issues
        config.module.rules.push({
            test: /\.m?js$/,
            type: 'javascript/auto',
            resolve: {
                fullySpecified: false,
            },
        });

        return config;
    },
    // Suppress build warnings for known issues
    typescript: {
        ignoreBuildErrors: false,
    },
    eslint: {
        ignoreDuringBuilds: false,
    },
}

module.exports = nextConfig
