import esbuild from "esbuild";

// List of native Node.js libraries to rewrite
const nodeLibraries = [
    'assert',
    'async_hooks',
    'buffer',
    'child_process',
    'cluster',
    'console',
    'constants',
    'crypto',
    'dgram',
    'dns',
    'domain',
    'events',
    'fs',
    'http',
    'http2',
    'https',
    'inspector',
    // 'module',
    'net',
    // 'os',
    // 'path',
    'perf_hooks',
    // 'process',
    'punycode',
    'querystring',
    'readline',
    'repl',
    // 'stream',
    'string_decoder',
    'timers',
    'tls',
    'trace_events',
    'tty',
    'url',
    'util',
    // 'v8',
    'vm',
    'worker_threads',
    'zlib',
];

const settings = {
    entryPoints: [
        "./src/main/js/ccxt-bootloader.ts"
    ],
    bundle: true,
    outfile: './dist/bundle.cjs',
    sourcemap: true,
    minify: true,
    platform: 'node',
    format: 'iife', //cjs
    target: 'node22',
    treeShaking: false,
    supported: {
        'dynamic-import': false,
    },
    define: {
        // self: 'globalThis',
    },
    sourcesContent: false, // sourcemaps will be generated without sources content but are useful for stacktraces with original file names
    // external: ['ws'],
    plugins: [
        {
            name: 'node-libs-rewrite',
            setup(build) {
                // Intercept module resolution
                build.onResolve({filter: /.*/}, (args) => {
                    if (nodeLibraries.includes(args.path)) {
                        return {path: `node:${args.path}`, external: true}; // Rewrite the import path to "node:library"
                    }
                });
            },
        },
    ],
}

esbuild.build(settings).then(() => {
    console.info('Build succeeded');
// eslint-disable-next-line no-undef
}).catch((reason) => {
    console.error('Build failed. Check process console for details.');
    console.error(reason);
    process.exit(1);
})
