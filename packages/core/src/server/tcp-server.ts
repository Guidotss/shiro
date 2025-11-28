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
    socket.on('data', (chunk) => {
      const parsed = this.parser.parse(chunk);
      if (!parsed) {
        // [GO] -> v1: se ignora el request incompleto
        return;
      }

      const req = new HttpRequest(
        parsed.method,
        parsed.path,
        parsed.headers,
        parsed.body
      );
      const res = new HttpResponse(socket);

      try {
        this.handler(req, res);
      } catch (err) {
        console.error('Error in request handler:', err);
        if (!socket.destroyed) {
          res.status(500).json({ error: 'Internal Server Error' });
        }
      }
    });

    socket.on('error', (err) => {
      console.error('Socket error:', err);
      if (!socket.destroyed) {
        socket.destroy();
      }
    });
  }
}
