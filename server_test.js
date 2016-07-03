var http = require("http");

http.createServer(function (request, response) {
  response.writeHead(200, {'Content-Type': 'text/plain'});
  response.end('Hello World\n');
}).listen(process.env.Port, process.env.IP);

console.log('Server running at ' + process.env.IP + ':' + process.env.Port);