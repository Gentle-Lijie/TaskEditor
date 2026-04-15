import {defineConfig} from 'vite';
import vue from '@vitejs/plugin-vue';
import {fileURLToPath, URL} from 'node:url';
import {execSync} from 'child_process'

function getGitHash() {
    return execSync('git rev-parse --short HEAD').toString().trim()
}

export default defineConfig({
    base: '/TaskEditor/',
    plugins: [vue()],
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url)),
        },
    },
    define: {
        __APP_VERSION__: JSON.stringify(getGitHash())
    }
});
