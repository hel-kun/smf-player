import { SmfData, Header, Track, Tempo, Beat, Note, SmfBinary, Scale, isOctave } from '@/app/lib/def';

const scaleMap: Scale[] = [
  "C", 
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
]

const getHeader = (headerBuffer: ArrayBuffer): Header => {
  const format: number = new DataView(headerBuffer, 8, 2).getUint16(0);
  const tracks: number = new DataView(headerBuffer, 10, 2).getUint16(0);
  const division: number = new DataView(headerBuffer, 12, 2).getUint16(0);
  return { format, tracks, division };
}

const getTrack = (trackBuffer: ArrayBuffer): Track => {
  const tempos: Tempo[] = [], beats: Beat[] = [], notes: Note[] = [];
  let cursor: number = 8;

  let deltaTime: number = 0;
  const metaEventHandlers: { [key: number]: () => void } = {
    0x01: () => {
      const textLength: number = new DataView(trackBuffer, cursor, 1).getUint8(0);
      cursor++;
      cursor += textLength;
    },
    0x02: () => {
      const cpRightLength: number = new DataView(trackBuffer, cursor, 1).getUint8(0);
      cursor++;
      cursor += cpRightLength;
    },
    0x03: () => {
      const trNameLength: number = new DataView(trackBuffer, cursor, 1).getUint8(0);
      cursor++;
      cursor += trNameLength;
    },
    0x04: () => {
      const instLength: number = new DataView(trackBuffer, cursor, 1).getUint8(0);
      cursor++;
      cursor += instLength;
    },
    0x05: () => {
      const lyricLength: number = new DataView(trackBuffer, cursor, 1).getUint8(0);
      cursor++;
      cursor += lyricLength;
    },
    0x06: () => {
      const markerLength: number = new DataView(trackBuffer, cursor, 1).getUint8(0);
      cursor++;
      cursor += markerLength;
    },
    0x07: () => {
      const cueLength: number = new DataView(trackBuffer, cursor, 1).getUint8(0);
      cursor++;
      cursor += cueLength;
    },
    0x20: () => {
      cursor += 2;
    },
    0x51: () => {
      const tempoLength: number = new DataView(trackBuffer, cursor, 1).getUint8(0);
      cursor++;
      const tempo: number = (new DataView(trackBuffer, cursor, 1).getUint8(0) << 16) |
        (new DataView(trackBuffer, cursor + 1, 1).getUint8(0) << 8) |
        new DataView(trackBuffer, cursor + 2, 1).getUint8(0);
      tempos.push({ bpm: 60 / (tempo * 10 ** (-6)), timing: deltaTime });
      cursor += tempoLength;
    },
    0x54: () => {
      cursor += 6;
    },
    0x58: () => {
      const beatLength: number = new DataView(trackBuffer, cursor, 1).getUint8(0);
      cursor++;
      const beatNumerator: number = new DataView(trackBuffer, cursor, 1).getUint8(0);
      const beatDenominator: number = 2 ** (new DataView(trackBuffer, cursor + 1, 1).getUint8(0));
      beats.push({ beat_denominator: beatDenominator, beat_numerator: beatNumerator, timing: deltaTime });
      cursor += beatLength;
    },
    0x59: () => {
      cursor += 3;
    },
    0x7f: () => {
      const sequencerLength: number = new DataView(trackBuffer, cursor, 1).getUint8(0);
      cursor++;
      cursor += sequencerLength;
    }
  };

  while (true) {
    const quotient: number = new DataView(trackBuffer, cursor, 1).getUint8(0);
    if (quotient < 0x80) {
      cursor++;
    } else {
      const reminder: number = new DataView(trackBuffer, cursor + 1, 1).getUint8(0);
      deltaTime += (quotient - 128) * 128 + reminder;
      cursor += 2;
    }
    const statusByte = new DataView(trackBuffer, cursor, 1).getUint8(0);
    console.log(statusByte);
    cursor++;

    switch (statusByte) {
      case 0xff: {
        const metaEvent = new DataView(trackBuffer, cursor, 1).getUint8(0);
        cursor++;
        if (metaEvent === 0x2f) {
          console.log("end of track");
          return { tempos, beats, notes };
        }
        if (metaEventHandlers[metaEvent]) {
          metaEventHandlers[metaEvent]();
        }
        break;
      }
      case 0xb0: {
        cursor += 2;
        break;
      }
      case 0xc0: {
        cursor++;
        break;
      }
      case 0xe0: {
        cursor += 2;
        break;
      }
      case 0x90: {
        const scaleNumber: number = new DataView(trackBuffer, cursor, 1).getUint8(0);
        const scale = scaleMap.at(scaleNumber % 12);
        if (!scale){
          break;
        }
        const oct = Math.floor(scaleNumber / 12);
        if (!isOctave(oct)){
          break;
        }
        const octave = oct;
        cursor++;
        const velocity = new DataView(trackBuffer, cursor, 1).getUint8(0);
        notes.push({ scale: scale, octave: octave, timing: deltaTime, length: 0, velocity });
        cursor++;
        break;
      }
      case 0x80: {
        const scaleNumber = new DataView(trackBuffer, cursor, 1).getUint8(0);
        const scale = scaleMap.at(scaleNumber % 12);
        if (!scale) {
          break;
        }
        const oct = Math.floor(scaleNumber / 12);
        if (!isOctave(oct)) {
          break;
        }
        const octave = oct;
        cursor++;
        const noteOffVelocity = new DataView(trackBuffer, cursor, 1).getUint8(0);
        const noteIndex = notes.findIndex(note => note.scale === scale && note.octave === octave && note.length === 0);
        if (noteIndex !== -1) {
          notes[noteIndex].length = deltaTime - notes[noteIndex].timing;
        }
        cursor++;
        break;
      }
    }
  }
  return { tempos, beats, notes };
};

export const analyze = (binary: SmfBinary): SmfData => {
  const header: Header = getHeader(binary.header);
  const track: Track = { tempos: [], beats: [], notes: [] };
  for (const trk of binary.track) {
    const analyzedTrack = getTrack(trk);
    track.tempos.push(...analyzedTrack.tempos);
    track.beats.push(...analyzedTrack.beats);
    track.notes.push(...analyzedTrack.notes);
  }
  return { header, track };
}