interface Table {
  id: ID;
  sector_id: ID;
  name: string;
  min_size: number;
  max_size: number;
  created_at: ISOTimeStamp;
  updated_at: ISOTimeStamp;
}

type Bookings = {
  id: ID;
  tableIds: Array<ID>;
  partySize: number;
  start: ISOTimeStamp;
  end: ISOTimeStamp;
  status: string;
};
