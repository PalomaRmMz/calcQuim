// Windows: bridge IPv4 adb reverse to Metro's IPv6 localhost listener.
// Metro's WebSocket transport is essential for native dynamic imports in dev.
import http from 'node:http';
import net from 'node:net';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export function createMetroLoopbackProxy({ port = 8081, targetPort = port } = {}) {
  for (const value of [port, targetPort]) {
    if (!Number.isInteger(value) || value < 0 || value > 65535) throw new Error('INVALID_PORT');
  }
  const sockets = new Set();
  const track = socket => {
    sockets.add(socket);
    socket.once('close', () => sockets.delete(socket));
    return socket;
  };
  const server = http.createServer((req, res) => {
    const upstream = http.request({ hostname: '::1', port: targetPort, method: req.method, path: req.url, headers: req.headers }, response => {
      res.writeHead(response.statusCode, response.headers);
      response.pipe(res);
    });
    upstream.on('error', () => {
      if (!res.headersSent) res.writeHead(502);
      res.end('Metro localhost no disponible.');
    });
    req.on('aborted', () => upstream.destroy());
    req.pipe(upstream);
  });
  server.on('connection', track);
  server.on('upgrade', (req, socket, head) => {
    const upstream = track(net.connect({ host: '::1', port: targetPort }, () => {
      const headers = req.rawHeaders.reduce((text, value, index) => text + (index % 2 ? `${value}\r\n` : `${value}: `), '');
      upstream.write(`${req.method} ${req.url} HTTP/${req.httpVersion}\r\n${headers}\r\n`);
      if (head.length) upstream.write(head);
      socket.pipe(upstream);
      upstream.pipe(socket);
    }));
    upstream.on('error', () => socket.destroy());
    socket.on('error', () => upstream.destroy());
    socket.on('close', () => upstream.destroy());
  });
  return {
    server,
    async start() {
      await new Promise((resolve, reject) => { server.once('error', reject); server.listen(port, '127.0.0.1', resolve); });
      return server.address().port;
    },
    async close() {
      for (const socket of sockets) socket.destroy();
      if (server.listening) await new Promise(resolve => server.close(resolve));
    },
  };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(process.argv[2] || 8081);
  const proxy = createMetroLoopbackProxy({ port });
  try {
    await proxy.start();
    console.log(`Metro IPv4 http://127.0.0.1:${port} → IPv6 localhost (HTTP + WebSocket).`);
    const stop = () => proxy.close().catch(() => { process.exitCode = 1; });
    process.once('SIGINT', stop);
    process.once('SIGTERM', stop);
  } catch (error) {
    console.error(error.code === 'EADDRINUSE' ? 'Puerto ocupado: no se cerraron procesos existentes.' : 'No se pudo iniciar el puente local.');
    process.exitCode = 1;
  }
}
