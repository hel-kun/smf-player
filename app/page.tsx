"use client";

import { play } from "@/app/smf/play";
import { useState } from "react";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);

  return (
    <div>
      <input type="file" accept=".mid" onInput={(e) => {
        const selectedFile = (e.target as HTMLInputElement).files?.[0];
        setFile(selectedFile || null);
      }} />
      <button onClick={
        async () => {
          if (!file) {
            return;
          }
          await play(file);
        }
      }>Play</button>
    </div>
  );
}
