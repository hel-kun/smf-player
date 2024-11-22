import { parse } from "@/app/smf/parse";
import { analyze } from "@/app/smf/analysis";
import { SmfBinary, SmfData } from "@/app/lib/def";

const functionMap: { [key: string]: number } = {
  "C": 261.63,
  "C#": 277.18,
  "D": 293.66,
  "D#": 311.13,
  "E": 329.63,
  "F": 349.23,
  "F#": 369.99,
  "G": 392,
  "G#": 415.3,
  "A": 440,
  "A#": 466.16,
  "B": 493.88,
}

export const play = async (smfFile: File): Promise<void> => {
  const binaryData: SmfBinary = await parse(smfFile);
  console.log(binaryData);
  const smfData: SmfData = analyze(binaryData);
  console.log(smfData);

  const audioContext = new AudioContext();
  const oscillator = audioContext.createOscillator();
  oscillator.type = 'square';

  smfData.track.notes.forEach((note) => {
    const frequency = functionMap[note.scale] * Math.pow(2, note.octave - 3);
    const bpm = smfData.track.tempos[0].bpm;
    const division = smfData.header.division;
    const secondsPerTick = 60 / (bpm * division);

    const startTime = audioContext.currentTime + note.timing * secondsPerTick;
    const duration = note.length * secondsPerTick;
    const oscillator = audioContext.createOscillator();
    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(frequency, startTime);
    oscillator.connect(audioContext.destination);
    oscillator.start(startTime);
    oscillator.stop(startTime + duration);
  });
};