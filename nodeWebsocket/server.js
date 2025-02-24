import { createServer } from "http";
const PORT = 2211;
createServer((request, response) => {
  response.writeHead(200);
  response.end("Hey there");
}).listen(PORT, () => console.log("Server listing to port ", PORT));

["uncaughtException", "unhandleRejection"].forEach((event) => {
  process.on(event, (err) => {
    console.error(
      `Something went wrong! event: ${event}, msg: ${err.stack || err}`
    );
  });
});
