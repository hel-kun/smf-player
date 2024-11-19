export type SmfData = {
  file: File;
  header: ArrayBuffer;
  track: ArrayBuffer[];
}

export type Header = {
  format: number;
  trackCount: number;
  division: number;
}