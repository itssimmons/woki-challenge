create table if not exists sectors (
	id 						text,
	restaurant_id text null,
	name 					text,
	created_at 		timestamp not null default current_timestamp, 
	updated_at 		timestamp not null default current_timestamp,
	
	primary key (id),
	foreign key (restaurant_id) references restaurants(id) on delete cascade
);
