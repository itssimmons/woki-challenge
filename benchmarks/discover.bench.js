import autocannon, { } from 'autocannon';

console.log(
	await autocannon({
		method: 'GET',	
		url: 'http://localhost:8080/1/woki/discover?restaurantId=R1'
		  + '&sectorId=S1'
		  + '&date=2025-10-22'
		  + '&partySize=6'
		  + '&duration=15',
	  workers: 4,
	  connections: 300,
	  duration: 30,
	})
)
