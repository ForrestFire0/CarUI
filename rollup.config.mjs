import svelte from 'rollup-plugin-svelte';
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import livereload from 'rollup-plugin-livereload';
import css from 'rollup-plugin-css-only';
import {terser} from "rollup-plugin-terser";

const production = !process.env.ROLLUP_WATCH || !(process.env.COMPUTERNAME === "FORRESTS-LAPTOP" && process.env.fakeData);

console.log(`We are${production ? "" : " not"} in production.`);
console.log(`We are${process.env.serve ? "" : " not"} serving.`);

function serve() {
    let server;

    function toExit() {
        if (server) server.kill(0);
    }

    return {
        writeBundle() {
            if (server) return;
            server = require('child_process').spawn('npm', ['run', 'svelte-start', '--', '--dev'], {
                stdio: ['ignore', 'inherit', 'inherit'],
                shell: true
            });

            process.on('SIGTERM', toExit);
            process.on('exit', toExit);
        }
    };
}

export default {
    input: 'svelte.js',
    output: {
        sourcemap: true,
        format: 'iife',
        name: 'app',
        file: 'public/build/bundle.js'
    },
    plugins: [
        svelte({
            compilerOptions: {
                // enable run-time checks when not in production
                dev: !production
            },
            onwarn: (warning, handler) => {
                if (warning.code.startsWith('a11y')) return;
                // let Rollup handle all other warnings normally
                handler(warning)
            }
        }),
        // we'll extract any component CSS out into
        // a separate file - better for performance
        css({output: 'bundle.css'}),

        // If you have external dependencies installed from
        // npm, you'll most likely need these plugins. In
        // some cases you'll need additional configuration -
        // consult the documentation for details:
        // https://github.com/rollup/plugins/tree/master/packages/commonjs
        resolve({
            browser: true,
            dedupe: ['svelte']
        }),
        commonjs(),

        // In dev mode, call `npm run start` once
        // the bundle has been generated
        !production && process.env.serve && serve(),

        // Watch the `public` directory and refresh the
        // browser on changes when not in production
        !production && livereload('public'),

        // If we're building for production (npm run build
        // instead of npm run dev, minify
        production && terser({'keep_classnames': true})
    ],
    watch: {
        clearScreen: false
    }
};
