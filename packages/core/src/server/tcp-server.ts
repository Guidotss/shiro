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

  private handleConnection(socket: Socket) {
    this.buffers.set(socket, Buffer.alloc(0));
  
    socket.on("data", (chunk) => {
      const current = this.buffers.get(socket) || Buffer.alloc(0);
      const newBuffer = Buffer.concat([current, chunk]);
  
      const parsed = this.parser.parse(newBuffer);
  
      if (!parsed) {
        // [GO] -> v1: se actualiza el buffer y se espera el request completo
        this.buffers.set(socket, newBuffer);
        return;
      }
  
      this.buffers.set(socket, Buffer.alloc(0));
  
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
        console.error("Handler error:", err);
        if (!socket.destroyed) {
          res.status(500).json({ error: "Internal Server Error" });
        }
      }
    });
  }
  
}
