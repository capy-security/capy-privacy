// config.ts

interface Config {
    apiUrl: string;
}

const config: Config = {
    apiUrl: import.meta.env.VITE_API_URL || 'http://127.0.0.1/'
};

export default config;

