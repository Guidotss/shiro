import { TcpServer, HttpRequest, HttpResponse } from "@shiro/core";

const server = new TcpServer({ port: 3000 });

server.setHandler((req: HttpRequest, res: HttpResponse) => {
  if (req.path === "/") {
    return res.send("Hola desde Shiro");
  }

  if (req.path === "/json") {
    return res.json({
      ok: true,
      path: req.path,
      method: req.method
    });
  }

  res.status(404).send("Not Found");
});

server.listen(() => {
  console.log("Shiro TCP server listening on http://localhost:3000");
});
