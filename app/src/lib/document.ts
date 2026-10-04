/** SHA-256 of the file, computed in the browser. The file itself never leaves the device. */
export async function sha256(file: File): Promise<Uint8Array> {
  return new Uint8Array(await crypto.subtle.digest("SHA-256", await file.arrayBuffer()));
}

export const hex = (b: Uint8Array | number[]): string => Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
