import svelte from 'rollup-plugin-svelte';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import livereload from 'rollup-plugin-livereload';
import { terser } from 'rollup-plugin-terser';

const production = !process.env.ROLLUP_WATCH;

function serve() {
	let server;
	const kill = server => server.kill(0);

	return {
		writeBundle() {
			if (server) return;

			server = require('child_process').spawn('npm', ['run', 'start', '--', '--dev'], {
				stdio: ['ignore', 'inherit', 'inherit'],
				shell: true
			});

			process.on('SIGTERM', kill);
			process.on('exit', kill);
		}
	};
}

export default {
	input: 'main.js',
	output: {
		sourcemap: false,
		format: 'iife',
		name: 'app',
		file: '../bundle.js'
	},
	plugins: [
		svelte({ dev: !production, css: css => css.write('bundle.css', false) }),
		resolve({ browser: true, dedupe: ['svelte'] }),
		commonjs(),

		!production && serve(),
		!production && livereload('..'),
		production && terser()
	],
	watch: { clearScreen: false }
};
