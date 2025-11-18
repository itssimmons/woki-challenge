interface Table {
  id: ID;
  sector_id: ID;
  name: string;
  min_size: number;
  max_size: number;
  created_at: Timestamp;
  updated_at: Timestamp;
}
