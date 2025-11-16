create table if not exists tables (
	id 						text,
	sector_id 		text null,
	name 					text,
	min_size 			integer,
	max_size 			integer,
	created_at 		timestamp not null default current_timestamp, 
	updated_at 		timestamp not null default current_timestamp,
	
	primary key (id),
	foreign key (sector_id) references sectors(id) on delete cascade
);
