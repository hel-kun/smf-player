import { parse } from "@/app/smf/parse";
import { analyze } from "@/app/smf/analysis";
import { SmfBinary, SmfData } from "@/app/lib/def";

export const play = async (smfFile: File): Promise<void> => {
  const data: SmfBinary = await parse(smfFile);
  console.log(data);
  
};