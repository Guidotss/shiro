import net, { Socket } from 'net';
import { HttpParser } from '../http/http-parser';
import { HttpRequest } from '../http/http-request';
import { HttpResponse } from '../http/http-response';

export type ShiroRequestHandler = (req: HttpRequest, res: HttpResponse) => void;

export interface TcpServerOptions {
  port: number;
  host?: string;
}

export class TcpServer {
  private server: net.Server;
  private parser = new HttpParser();
  private buffers = new WeakMap<Socket, Buffer>();

  private handler: ShiroRequestHandler = (req, res) => {
    res.json({
      framework: 'Shiro',
      message: `Default handler: ${req.method} ${req.path}`,
    });
  };

  constructor(private readonly options: TcpServerOptions) {
    this.server = net.createServer(this.handleConnection.bind(this));
  }

  setHandler(handler: ShiroRequestHandler): this {
    this.handler = handler;
    return this;
  }

  listen(callback?: () => void): void {
    const { port, host } = this.options;
    this.server.listen(port, host ?? '0.0.0.0', callback);
  }

  close(callback?: (err?: Error) => void): void {
    this.server.close(callback);
  }
  private handleConnection(socket: Socket): void {
    this.buffers.set(socket, Buffer.alloc(0));

    let isProcessing = false;

    socket.on('data', async (chunk) => {
      let buffer = Buffer.concat([this.buffers.get(socket)!, chunk]);

      while (true) {
        const parsed = this.parser.parse(buffer);

        if (!parsed) {
          this.buffers.set(socket, buffer);
          return;
        }

        const raw = buffer.toString('utf-8');
        const headerEnd = raw.indexOf('\r\n\r\n');
        const bodyStart = headerEnd + 4;

        const contentLength = parsed.headers['content-length']
          ? parseInt(parsed.headers['content-length'], 10)
          : 0;

        const fullLength = bodyStart + contentLength;

        const remaining = buffer.subarray(fullLength);
        this.buffers.set(socket, remaining);
        buffer = remaining;

        if (isProcessing) continue;
        isProcessing = true;

        const req = new HttpRequest(
          parsed.method,
          parsed.path,
          parsed.headers,
          parsed.body
        );

        const wantsKeepAlive =
          req.getHeader('connection')?.toLowerCase() === 'keep-alive';

        const res = new HttpResponse(socket, wantsKeepAlive);

        try {
          await this.handler(req, res);
        } catch (err) {
          console.error('[Shiro] Handler error:', err);
          if (!socket.destroyed) {
            res.status(500).json({ error: 'Internal Server Error' });
          }
        }

        isProcessing = false;

        if (buffer.length === 0) return;
      }
    });

    socket.on('error', (err) => {
      console.error('[Shiro] Socket error:', err);
      socket.destroy();
    });
  }
}
