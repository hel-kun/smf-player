import { parse } from "@/app/smf/parse";
import { SmfData, Header } from "@/app/lib/def";

const getHeader = (headerBuffer: ArrayBuffer): Header => {
  const format: number = new DataView(headerBuffer, 8, 2).getUint16(0);
  const trackCount: number = new DataView(headerBuffer, 10, 2).getUint16(0);
  const division: number = new DataView(headerBuffer, 12, 2).getUint16(0);
  return { format, trackCount, division };
}

export const play = async (smfFile: File): Promise<void> => {
  const data: SmfData = await parse(smfFile);
  console.log(data);

  const header: Header = getHeader(data.header);
  console.log(header);
};