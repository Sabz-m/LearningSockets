import { createServer } from "http";
const PORT = 2211;
import crypto from "crypto";
const WEB_SOCKET_MAGIC_STRING = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11";

const SEVEN_BITS_INTERGER_MARKER = 125;
const SIXTEEN_BITS_INTERGER_MARKER = 126;
const SIXTYFOUR_BITS_INTERGER_MARKER = 127;

const MASK_KEY_BYTES_LENGTH = 4;

const FIRST_BIT = 128;

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
  socket.on("readable", () => onSocketReadable(socket));
}

function onSocketReadable(socket) {
  socket.read(1);
  const [markerAndPayloadLength] = socket.read(1);

  const lengthIndicatorInBits = markerAndPayloadLength - FIRST_BIT;

  let messageLength = 0;

  if (lengthIndicatorInBits <= SEVEN_BITS_INTERGER_MARKER) {
    messageLength = lengthIndicatorInBits;
  } else {
    throw new Error("your message is too long. we dont have 64-bit messages");
  }

  const maskKey = socket.read(MASK_KEY_BYTES_LENGTH);
  const encoded = socket.read(messageLength);
  const decoded = unmask(encoded, maskKey);
  const received = decoded.toString("utf-8");

  const data = JSON.parse(received);
  console.log("message received", data);
}

function unmask(encodedBuffer, maskKey) {
  const finalBuffer = Buffer.from(encodedBuffer);

  const fillWithEightZeros = (t) => t.padStart(8, "0");
  const toBinary = (t) => fillWithEightZeros(t.toString(2));
  const fromBinaryToDecimal = (t) => parseInt(toBinary(t), 2);
  const getCharFromBinary = (t) => String.fromCharCode(fromBinaryToDecimal(t));

  for (let i = 0; i < encodedBuffer.length; i++) {
    finalBuffer[i] = encodedBuffer[i] ^ maskKey[i % MASK_KEY_BYTES_LENGTH];
    const logger = {
      decoded: getCharFromBinary(finalBuffer[i]),
    };
    console.log(logger);
  }
  return finalBuffer;
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

["uncaughtException", "unhandledRejection"].forEach((event) => {
  process.on(event, (err) => {
    console.error(
      `Something went wrong! event: ${event}, msg: ${err.stack || err}`
    );
  });
});
