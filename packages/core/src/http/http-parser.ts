import { ParsedRequest } from "./http-types";

export class HttpParser {
  parse(buffer: Buffer): ParsedRequest | null {
    const raw = buffer.toString("utf-8");

    const headerEnd = raw.indexOf("\r\n\r\n");
    if (headerEnd === -1) return null;

    const headerPart = raw.substring(0, headerEnd);
    const [requestLine, ...headerLines] = headerPart.split("\r\n");

    const [method, path] = requestLine.split(" ");

    const headers: Record<string, string> = {};
    for (const line of headerLines) {
      const [key, value] = line.split(": ");
      if (key && value) {
        headers[key.toLowerCase()] = value;
      }
    }

    const contentLength = headers["content-length"]
      ? parseInt(headers["content-length"], 10)
      : 0;

    const bodyStartIndex = headerEnd + 4;
    const totalLengthNeeded = bodyStartIndex + contentLength;

    if (buffer.length < totalLengthNeeded) {
      return null;
    }

    const bodyBuffer = buffer.subarray(bodyStartIndex, totalLengthNeeded);
    const body = bodyBuffer.length > 0 ? bodyBuffer.toString("utf-8") : null;

    return {
      method,
      path,
      headers,
      body
    };
  }
}
