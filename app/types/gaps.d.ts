type GapKind = 'combo' | 'single';

interface Gap {
  kind: GapKind;
  tableIds: string[];
  maxSize: number;
  minSize: number;
  startDate: ISOTimeStamp;
  endDate: ISOTimeStamp;
}
