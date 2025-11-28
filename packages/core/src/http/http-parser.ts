import { ParsedRequest } from "./http-types";

export class HttpParser {
  parse(buffer: Buffer): ParsedRequest | null {
    const raw = buffer.toString("utf-8");

    const headerEnd = raw.indexOf("\r\n\r\n");
    if (headerEnd === -1) {
      return null;
    }

    const headerPart = raw.substring(0, headerEnd);
    const [requestLine, ...headerLines] = headerPart.split("\r\n");

    const [method, path] = requestLine.split(" ");

    const headers: Record<string, string> = {};
    for (const line of headerLines) {
      const [key, value] = line.split(": ");
      if (!key || !value) continue;
      headers[key.toLowerCase()] = value;
    }

    const bodyPart = raw.substring(headerEnd + 4);
    const body = bodyPart.length > 0 ? bodyPart : null;

    return { method, path, headers, body };
  }
}
