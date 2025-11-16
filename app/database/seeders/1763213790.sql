insert into restaurants ( id, name, timezone, created_at, updated_at )
values
	(
		'R1',
		'Bistro Central',
		'America/Argentina/Buenos_Aires',
		'2025-10-22T00:00:00-03:00',
		'2025-10-22T00:00:00-03:00'
	);

insert into windows ( restaurant_id, start, end )
values
	(
		'R1',
		'12:00',
		'16:00'
	),
	(
		'R1',
		'16:00',
		'23:45'
	);
