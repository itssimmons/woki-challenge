create table if not exists restaurants (
	id 					text,
	name 				text not null,
	timezone		text,
	updated_at 	timestamp not null default current_timestamp,
	created_at 	timestamp not null default current_timestamp,
	
	primary key (id)
);

create table if not exists windows (
	restaurant_id text null,
	start 				text not null,
	end 					text not null,
	
	primary key (restaurant_id, start, end),
	foreign key (restaurant_id) references restaurants(id) on delete cascade
);
