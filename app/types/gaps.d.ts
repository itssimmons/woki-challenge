type GapKind = 'combo' | 'single';

interface Gap {
  kind: GapKind;
  tableIds: string[];
  sectorId: string;
  maxSize: number;
  minSize: number;
  startDate: ISOTimeStamp;
  endDate: ISOTimeStamp;
}
