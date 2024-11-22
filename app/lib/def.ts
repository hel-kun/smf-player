export type SmfBinary = {
  file: File;
  header: ArrayBuffer;
  track: ArrayBuffer[];
}

export type Header = {
  format: number;
  tracks: number;
  division: number;
}

export type Scale = "C" | "C#" | "D" | "D#" | "E" | "F" | "F#" | "G" | "G#" | "A" | "A#" | "B";

export type Note = {
  scale: Scale;
  octave: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 ;
  timing: number;
  length: number;
  velocity: number;
}

export type Tempo = {
  bpm: number;
  timing: number;
}
export type Beat = {
  beat_denominator: number;
  beat_numerator: number;
  timing: number;
}

export type Track = {
  tempos: Tempo[];
  beats: Beat[];
  notes: Note[];
}

export type SmfData = {
  header: Header;
  track: Track;
}