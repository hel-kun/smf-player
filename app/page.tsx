"use client";

import { play } from "@/app/smf/play";

export default function Home() {
  return (
    <div>
      <input type="file" accept=".mid" onInput={(e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          play(file);
        }
      }} />
    </div>
  );
}
