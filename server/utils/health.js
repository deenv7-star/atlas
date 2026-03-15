import net from 'node:net';
import { URL } from 'node:url';

export async function checkTcp(urlString, timeoutMs = 1000) {
  return new Promise((resolve) => {
    try {
      const parsed = new URL(urlString);
      const host = parsed.hostname;
      const port = Number(parsed.port);

      const socket = new net.Socket();
      const finish = (ok) => {
        socket.destroy();
        resolve(ok);
      };

      socket.setTimeout(timeoutMs);
      socket.once('connect', () => finish(true));
      socket.once('error', () => finish(false));
      socket.once('timeout', () => finish(false));
      socket.connect(port, host);
    } catch {
      resolve(false);
    }
  });
}
