import { exec } from 'node:child_process';

exec('node ./benchmarks/health.bench.js', (error, stdout, stderr) => {
	if (error) {
		console.error(`Error executing benchmark: ${error.message}`);
		return;
	}
	if (stderr) {
		console.error(`Benchmark stderr: ${stderr}`);
		return;
	}
	console.log(`Benchmark results:\n${stdout}`);
});
