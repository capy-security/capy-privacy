/// <reference types="node" />
import { defineConfig } from 'orval';

export default defineConfig({
    capy: {
        input: {
            // Use URL to fetch from running API, or local file './openapi.json'
            target: process.env.API_OPENAPI_URL || 'http://127.0.0.1/openapi.json',
        },
        output: {
            client: 'svelte-query',
            mode: 'tags-split',
            target: './src/lib/api/generated',
            schemas: './src/lib/api/generated/models',
            indexFiles: true,
            clean: true,
            tsconfig: './tsconfig.json',
            mock: false,
            override: {
                mutator: {
                    path: './src/lib/api/mutator.ts',
                    name: 'fetchApi',
                },
                query: {
                    usePrefetch: true,
                },
            },
        },
    },
});

