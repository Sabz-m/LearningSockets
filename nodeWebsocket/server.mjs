import { createServer } from "http";
const PORT = 2211;

const WEB_SOCKET_MAGIC_STRING = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11";
import crypto from "crypto";

const server = createServer((request, response) => {
  response.writeHead(200);
  response.end("Hey there");
}).listen(PORT, () => console.log("Server listing to port ", PORT));

server.on("upgrade", onSocketUpgrade);

function onSocketUpgrade(req, socket, head) {
  const { "sec-websocket-key": webClientSocketKey } = req.headers;
  console.log(`${webClientSocketKey} has connected!`);
  const headers = prepareHandShakeHeaders(webClientSocketKey);
  socket.write(headers);
}

function prepareHandShakeHeaders(id) {
  const acceptKey = createSocketAccept(id);
  const headers = [
    "HTTP/1.1 101 Switching Protocols",
    "Upgrade: websocket",
    "Connection: Upgrade",
    `Sec-WebSocket-Accept: ${acceptKey}`,
    "",
  ]
    .map((line) => line.concat("\r\n"))
    .join("");
  return headers;
}

function createSocketAccept(id) {
  const shaum = crypto.createHash("sha1");
  shaum.update(id + WEB_SOCKET_MAGIC_STRING);
  return shaum.digest("base64");
}

[("uncaughtException", "unhandleRejection")].forEach((event) => {
  process.on(event, (err) => {
    console.error(
      `Something went wrong! event: ${event}, msg: ${err.stack || err}`
    );
  });
});
