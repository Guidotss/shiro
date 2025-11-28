export interface ParsedRequest {
  method: string;
  path: string;
  headers: Record<string, string>;
  body: string | null;
}
