import autocannon from 'autocannon';

console.log(
	await autocannon({
		method: 'GET',
	  url: 'http://localhost:8080/health',
	  workers: 4,
	  connections: 25,
	  duration: 30,
	})
)
