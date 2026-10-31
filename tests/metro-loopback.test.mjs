import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import net from 'node:net';
import { createMetroLoopbackProxy } from '../integration/metro-loopback.mjs';

test('puente Metro conserva Host, ruta, contenido y upgrade WebSocket de Android', async () => {
  const sockets = new Set();
  const upstream = http.createServer((req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ host: req.headers.host, url: req.url }));
  });
  upstream.on('connection', socket => { sockets.add(socket); socket.on('close', () => sockets.delete(socket)); });
  upstream.on('upgrade', (req, socket, head) => {
    socket.write('HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\n\r\n');
    socket.on('data', data => socket.write(data));
    if (head.length) socket.write(head);
  });
  await new Promise(resolve => upstream.listen(0, '::1', resolve));
  const proxy = createMetroLoopbackProxy({ port: 0, targetPort: upstream.address().port });
  try {
    const port = await proxy.start();
    const response = await fetch(`http://127.0.0.1:${port}/index.bundle?platform=android`);
    assert.deepEqual(await response.json(), { host: `127.0.0.1:${port}`, url: '/index.bundle?platform=android' });
    await new Promise((resolve, reject) => {
      const socket = net.connect({ host: '127.0.0.1', port });
      const timer = setTimeout(() => { socket.destroy(); reject(new Error('UPGRADE_TIMEOUT')); }, 3000);
      let received = '';
      socket.on('connect', () => socket.write('GET /hot HTTP/1.1\r\nHost: localhost\r\nConnection: Upgrade\r\nUpgrade: websocket\r\n\r\nsynthetic-frame'));
      socket.on('data', data => {
        received += data.toString();
        if (received.includes('synthetic-frame')) {
          clearTimeout(timer);
          assert.match(received, /101 Switching Protocols/);
          socket.destroy(); resolve();
        }
      });
      socket.on('error', reject);
    });
  } finally {
    await proxy.close();
    for (const socket of sockets) socket.destroy();
    await new Promise(resolve => upstream.close(resolve));
  }
});
