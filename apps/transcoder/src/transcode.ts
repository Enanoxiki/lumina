import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdir } from "node:fs/promises";
const execFileP = promisify(execFile);

export async function transcode(input: string, outDir: string) {
  await mkdir(outDir, { recursive: true });
  await execFileP("ffmpeg", [
    "-i", input,
    "-c:v", "libx264", "-c:a", "aac",       // re-encode to HLS-compatible codecs
    "-hls_time", "6",                        // ~6s per segment
    "-hls_playlist_type", "vod",             // complete on-demand playlist (adds #EXT-X-ENDLIST)
    "-hls_segment_filename", `${outDir}/seg_%03d.ts`,
    `${outDir}/index.m3u8`,                  // the playlist (last arg = output)
  ]);
}