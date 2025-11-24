const http = require("http");
const fs = require("fs");
const path = require("path");

const server = http.createServer((req, res) => {
  // ruta del archivo solicitado
  let filePath = path.join(__dirname, req.url === "/" ? "game.html" : req.url);

  // detectar tipo MIME
  const ext = path.extname(filePath);
  const mimeTypes = {
    ".html": "text/html",
    ".css": "text/css",
    ".js": "application/javascript",
    ".m4a": "audio/mp4",
    ".mp3": "audio/mpeg",
    ".png": "image/png",
    ".jpg": "image/jpeg"
  };

  const contentType = mimeTypes[ext] || "application/octet-stream";

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "text/plain" });
      return res.end("Archivo no encontrado");
    }

    res.writeHead(200, { "Content-Type": contentType });
    res.end(content);
  });
});

server.listen(3000, () => {
  console.log("Server en http://localhost:3000");
});

