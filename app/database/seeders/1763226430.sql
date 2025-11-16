insert into bookings
	( id, restaurant_id, sector_id, party_size, start, end, duration_minutes, status, created_at, updated_at )
values
	(
		'BK_001',
		'R1',
		'S1',
		3,
		'2025-10-22T20:30:00-03:00',
		'2025-10-22T21:15:00-03:00',
		45,
		'CONFIRMED',
		'2025-10-22T18:00:00-03:00',
		'2025-10-22T18:00:00-03:00'
	);

insert into booked_tables ( booking_id, table_id )
values
	(
		'BK_001',
		'T2'
	);
