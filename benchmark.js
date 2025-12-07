// @ts-check
'use strict';

import util from 'node:util';
import child_process from 'node:child_process';
import chalk from 'chalk';
const exec = util.promisify(child_process.exec);

const log = console.log.bind(console);

(async () => {
	const scenarios = await Promise.all([
		exec('node ./benchmarks/discover.bench.js'),
		exec('node ./benchmarks/health.bench.js')
	])
	
	scenarios.forEach((scenario, idx) => {
		const { stdout, stderr } = scenario;

		log(chalk.gray('Benchmark'), chalk.gray(String(idx)))
		
		if (stderr) {
			log(chalk.red('Benchmark'), `Stderr`);
			log(stderr, null);
		}
		
		if (stdout) {
			log(chalk.green('Benchmark'), `Stdout`);
			log(stdout);
		}
	});
})()
