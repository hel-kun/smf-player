import { SmfData } from "@/app/lib/def";

const readBinary = (file: File): Promise<ArrayBuffer> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(reader.result as ArrayBuffer);
    };
    reader.onerror = () => {
      reject(reader.error);
    };
    reader.readAsArrayBuffer(file);
  });
};

const searchBinary = (buffer: ArrayBuffer, target: Uint8Array): number[] => {
  const bufferArray = new Uint8Array(buffer);
  const positions: number[] = [];
  for (let i = 0; i <= bufferArray.length - target.length; i++) {
    let found = true;
    for (let j = 0; j < target.length; j++) {
      if (bufferArray[i + j] !== target[j]) {
        found = false;
        break;
      }
    }
    if (found) {
      positions.push(i);
    }
  }
  return positions;
};

export const parse = async (smfFile: File): Promise<SmfData> => {
  const data: SmfData = {
    file: smfFile,
    header: new ArrayBuffer(0),
    track: [],
  };

  const buffer: ArrayBuffer = await readBinary(smfFile);

  // parse header
  const headerPoint = searchBinary(buffer, new Uint8Array([0x4d, 0x54, 0x68, 0x64]))[0];
  if (headerPoint === -1) {
    throw new Error("Invalid SMF file");
  }
  const headerLength: number = new DataView(buffer, headerPoint + 4, 4).getUint32(0) + 8;
  data.header = buffer.slice(headerPoint, headerPoint + headerLength);

  // parse tracks
  const trackPoints: number[] = searchBinary(buffer, new Uint8Array([0x4d, 0x54, 0x72, 0x6b]));
  for (let i = 0; i < trackPoints.length; i++) {
    if (trackPoints[i] === -1) {
      throw new Error("Invalid SMF file");
    }
    const trackLength: number = new DataView(buffer, trackPoints[i] + 4, trackPoints[i] + 8).getUint32(0) + 8;
    data.track.push(buffer.slice(trackPoints[i], trackPoints[i] + trackLength));
  }
  
  return {
    file: data.file,
    header: data.header,
    track: data.track,
  };
};