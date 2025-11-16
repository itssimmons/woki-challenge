create table if not exists bookings (
	id 								text,
	restaurant_id 		text not null,
	sector_id					text not null,
	party_size				integer not null,
	start 						timestamp not null,
	end 							timestamp not null,
	duration_minutes 	integer not null,
	/* Just for the pupose of the test, I'm gonna use an Enum, but I personally don't recommend them */
	status						text check( status in ('CONFIRMED', 'CANCELLED') ),
	created_at 				timestamp not null default current_timestamp,
	updated_at 				timestamp not null default current_timestamp,
	
	primary key (id),
	foreign key (restaurant_id) references restaurants(id) on delete cascade,
	foreign key (sector_id) references sectors(id) on delete cascade
);

create table if not exists booked_tables (
	booking_id	text,
	table_id		text,
	primary key (booking_id, table_id),
	foreign key (table_id) references tables(id) on delete cascade,
	foreign key (booking_id) references bookings(id) on delete cascade
)
