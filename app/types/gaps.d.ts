type GapKind = "combo" | "single";

interface Gap {
  kind: GapKink;
  tableIds: string[];
  maxSize: number;
  minSize: number;
}
