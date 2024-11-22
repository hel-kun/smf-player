import { SmfData, Header, Track, Tempo, Beat, Note, SmfBinary } from '@/app/lib/def';
import { COOKIE_NAME_PRERENDER_BYPASS } from 'next/dist/server/api-utils';

const getHeader = (headerBuffer: ArrayBuffer): Header => {
  const format: number = new DataView(headerBuffer, 8, 2).getUint16(0);
  const tracks: number = new DataView(headerBuffer, 10, 2).getUint16(0);
  const division: number = new DataView(headerBuffer, 12, 2).getUint16(0);
  return { format, tracks, division };
}

const getTrack = (trackBuffer: ArrayBuffer): Track => {
  const tempos: Tempo[] = [], beats: Beat[] = [], notes: Note[] = [];
  let pointer: number = 8;

  let deltaTime: number = 0;
  for(pointer; pointer < trackBuffer.byteLength; 1) {
    console.log("pointer: " + pointer);
    const quotient: number = new DataView(trackBuffer, pointer, 1).getUint8(0);
    if (quotient < 0x80) {
      pointer++;
    }else{
      const reminder: number = new DataView(trackBuffer, pointer+1, 1).getUint8(0);
      deltaTime += (quotient - 128) * 128 + reminder;
      pointer += 2;
    }
    const statusByte: number = new DataView(trackBuffer, pointer, 1).getUint8(0);
    pointer ++;

    switch (statusByte) {
      case 0xff: {
        const metaEvent: number = new DataView(trackBuffer, pointer, 1).getUint8(0);
        pointer++;
        switch (metaEvent) {
          case 0x01: {
            const textLength: number = new DataView(trackBuffer, pointer, 1).getUint8(0);
            pointer++;
            //const text: string = new TextDecoder().decode(new DataView(trackBuffer, pointer, textLength));
            pointer += textLength;
            break;
          }
          case 0x02: {
            const cpRightLength: number = new DataView(trackBuffer, pointer, 1).getUint8(0);
            pointer++;
            //const cpRight: string = new TextDecoder().decode(new DataView(trackBuffer, pointer, cpRightLength));
            pointer += cpRightLength;
            break;
          }
          case 0x03: {
            const trNameLength: number = new DataView(trackBuffer, pointer, 1).getUint8(0);
            pointer++;
            //const text: string = new TextDecoder().decode(new DataView(trackBuffer, pointer, trNameLength));
            pointer += trNameLength;
            break;
          }
          case 0x04: {
            const instLength: number = new DataView(trackBuffer, pointer, 1).getUint8(0);
            pointer++;
            //const instrument: string = new TextDecoder().decode(new DataView(trackBuffer, pointer, instLength));
            pointer += instLength;
            break;
          }
          case 0x05: {
            const lyricLength: number = new DataView(trackBuffer, pointer, 1).getUint8(0);
            pointer++;
            //const lyric: string = new TextDecoder().decode(new DataView(trackBuffer, pointer, lyricLength));
            pointer += lyricLength;
            break;
          }
          case 0x06: {
            const markerLength: number = new DataView(trackBuffer, pointer, 1).getUint8(0);
            pointer++;
            //const marker: string = new TextDecoder().decode(new DataView(trackBuffer, pointer, markerLength));
            pointer += markerLength;
            break;
          }
          case 0x07: {
            const cueLength: number = new DataView(trackBuffer, pointer, 1).getUint8(0);
            pointer++;
            //const cue: string = new TextDecoder().decode(new DataView(trackBuffer, pointer, cueLength));
            pointer += cueLength;
            break;
          }
          case 0x20: {
            pointer += 2;
            break;
          }
          case 0x51: {
            const tempoLength: number = new DataView(trackBuffer, pointer, 1).getUint8(0);
            console.log("tempoLength: " + tempoLength);
            pointer++;
            const tempo: number = (new DataView(trackBuffer, pointer, 1).getUint8(0) << 16) |
                                  (new DataView(trackBuffer, pointer + 1, 1).getUint8(0) << 8) |
                                  new DataView(trackBuffer, pointer + 2, 1).getUint8(0);
            console.log("tempo: " + tempo);
            tempos.push({ bpm: 60/(tempo*10**(-6)), timing: deltaTime });
            pointer += tempoLength;
            break;
          }
          case 0x54: {
            pointer += 6;
            break;
          }
          case 0x58: {
            const beatLength: number = new DataView(trackBuffer, pointer, 1).getUint8(0);
            console.log("beatLength: " + beatLength);
            pointer++;
            const beatNumerator: number = new DataView(trackBuffer, pointer, 1).getUint8(0);
            const beatDenominator: number = 2**(new DataView(trackBuffer, pointer+1, 1).getUint8(0));
            beats.push({ beat_denominator: beatDenominator, beat_numerator: beatNumerator, timing: deltaTime });
            pointer += beatLength;
            break;
          }
          case 0x59: {
            pointer += 3;
            break;
          }
          case 0x7f: {
            const sequencerLength: number = new DataView(trackBuffer, pointer, 1).getUint8(0);
            pointer++;
            //const sequencer: string = new TextDecoder().decode(new DataView(trackBuffer, pointer, sequencerLength));
            pointer += sequencerLength;
            break
          }
          case 0x2f: {
            return { tempos, beats, notes };
          }
        }
        break;
      }
      case 0xb0: {
        const control: number = new DataView(trackBuffer, pointer, 1).getUint8(0);
        pointer++;
        const value: number = new DataView(trackBuffer, pointer, 1).getUint8(0);
        pointer++;
        break;
      }
      case 0xc0: {
        const program: number = new DataView(trackBuffer, pointer, 1).getUint8(0);
        pointer++;
        break;
      }
      case 0xe0: {
        const pitch: number = (new DataView(trackBuffer, pointer, 1).getUint8(0) << 7) |
                             new DataView(trackBuffer, pointer + 1, 1).getUint8(0);
        pointer += 2;
        break;
      }
      case 0x90: {
        const note = new DataView(trackBuffer, pointer, 1).getUint8(0);
        break;
      }
      case 0x80: {
        break;
      }
    }
  }
  return { tempos, beats, notes };
};

export const analyze = (binary: SmfBinary): SmfData => {
  const header: Header = getHeader(binary.header);
  const track: Track = getTrack(binary.track[0]);
  return { header, track };
}