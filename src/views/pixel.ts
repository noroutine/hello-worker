// https://github.com/cloudflare/workers-sdk/issues/3800
// https://developers.cloudflare.com/workers/runtime-apis/nodejs/
import { Buffer } from "node:buffer";
globalThis.Buffer = Buffer;

import { uint8ArrayToString } from "../utils";

// Transparent PNG 1x1 pixel
const getPixelData = (): Uint8Array => {
  const base64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
  return Buffer.from(base64, 'base64');
};

export function PixelView(): string {
  return uint8ArrayToString(getPixelData())
};