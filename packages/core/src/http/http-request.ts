export class HttpRequest {
  public readonly method: string;
  public readonly path: string;
  public readonly headers: Record<string, string>;
  public readonly body: string | null;

  constructor(
    method: string,
    path: string,
    headers: Record<string, string>,
    body: string | null
  ) {
    this.method = method;
    this.path = path;
    this.headers = headers;
    this.body = body;
  }

  get headerNames(): string[] {
    return Object.keys(this.headers);
  }

  getHeader(name: string): string | undefined {
    return this.headers[name.toLowerCase()];
  }

  get json(): unknown | null {
    if (!this.body) return null;
    try {
      return JSON.parse(this.body);
    } catch {
      return null;
    }
  }
}
