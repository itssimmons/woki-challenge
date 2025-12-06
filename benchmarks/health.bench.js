import autocannon from 'autocannon';

console.log(
	await autocannon({
	  url: 'http://localhost:8080/health',
	  workers: 4,
	  connections: 100,
	  duration: 20,
	})
)
