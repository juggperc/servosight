import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'com.servosight.app',
    appName: 'ServoSight',
    webDir: 'out',
    server: {
        url: 'https://servosight.vercel.app',
        cleartext: true,
    },
    ios: {
        contentInset: 'always',
    },
};

export default config;
