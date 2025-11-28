import { Socket } from 'net';

export class HttpResponse {
  private statusCode = 200;
  private headers: Record<string, string> = {
    'Content-Type': 'text/plain; charset=utf-8',
  };
  private ended = false;

  constructor(private readonly socket: Socket) {}

  status(code: number): this {
    this.statusCode = code;
    return this;
  }

  setHeader(key: string, value: string): this {
    this.headers[key] = value;
    return this;
  }

  private writeHead() {
    let head = `HTTP/1.1 ${this.statusCode} ${this.getStatusText()}\r\n`;
    for (const [k, v] of Object.entries(this.headers)) {
      head += `${k}: ${v}\r\n`;
    }
    head += `\r\n`;
    this.socket.write(head);
  }

  private getStatusText(): string {
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

  send(body: string): void {
    if (this.ended) return;

    const length = Buffer.byteLength(body);
    this.headers['Content-Length'] = String(length);

    this.writeHead();
    this.socket.write(body);
    this.socket.end();
    this.ended = true;
  }

  json(data: unknown): void {
    const body = JSON.stringify(data);
    this.setHeader('Content-Type', 'application/json; charset=utf-8');
    this.send(body);
  }

  end(): void {
    if (this.ended) return;
    this.writeHead();
    this.socket.end();
    this.ended = true;
  }
}
