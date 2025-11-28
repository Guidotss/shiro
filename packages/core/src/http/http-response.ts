import { Socket } from 'net';

export class HttpResponse {
  private statusCode = 200;
  private headers: Record<string, string> = {
    'Content-Type': 'text/plain; charset=utf-8',
  };
  private ended = false;

  constructor(
    private readonly socket: Socket,
    private readonly keepAlive: boolean
  ) {}

  status(code: number): this {
    this.statusCode = code;
    return this;
  }

  setHeader(key: string, value: string): this {
    this.headers[key] = value;
    return this;
  }

  private statusText(): string {
    switch (this.statusCode) {
      case 200:
        return 'OK';
      case 201:
        return 'Created';
      case 400:
        return 'Bad Request';
      case 404:
        return 'Not Found';
      case 500:
        return 'Internal Server Error';
      default:
        return 'OK';
    }
  }

  private writeHead(): void {
    this.headers['Connection'] = this.keepAlive ? 'keep-alive' : 'close';

    let head = `HTTP/1.1 ${this.statusCode} ${this.statusText()}\r\n`;

    for (const [k, v] of Object.entries(this.headers)) {
      head += `${k}: ${v}\r\n`;
    }

    head += `\r\n`;
    this.socket.write(head);
  }

  send(body: string): void {
    if (this.ended) return;

    this.headers['Content-Length'] = Buffer.byteLength(body).toString();

    this.writeHead();
    this.socket.write(body);

    if (!this.keepAlive) this.socket.end();
    this.ended = true;
  }

  json(data: unknown): void {
    this.setHeader('Content-Type', 'application/json; charset=utf-8');
    this.send(JSON.stringify(data));
  }
}
