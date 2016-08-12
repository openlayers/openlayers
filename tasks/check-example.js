/*eslint-env es6*/

const http       = require('http');
const path       = require('path');
const serveFiles = require('serve-files');
const spawn      = require('child_process').spawn;

if (!process.argv[2]) {
  process.stdout.write(`USAGE: node ${path.basename(module.filename)} [example_path]\n`);
  process.exit(0);
}

const root = process.cwd();
const port = 8000;
const host = null;
const examplePath = process.argv[2];
const phantomPath = require('phantomjs-prebuilt').path;

const server = http.createServer(serveFiles.createFileResponseHandler({
  documentRoot       : root,
  followSymbolicLinks: false,
  cacheTimeInSeconds : 3600
}));

server.listen(port, host, null, function() {
  const childProcess = spawn(phantomPath, ['--ssl-protocol=any', '--ignore-ssl-errors=true', path.join(__dirname, '..', 'bin', 'check-example.js'), 'http://localhost:8000/' + examplePath]);
  childProcess.stdout.pipe(process.stdout);
  childProcess.stderr.pipe(process.stderr);
  process.stdin.pipe(childProcess.stdin);

  childProcess.on('error', function(err) {
    process.stderr.write(`Error executing phantom on ${phantomPath}\n`);
    process.stderr.write(err.stack + '\n');
    process.exit(1);
  });

  childProcess.on('exit', function(code) {
    process.exit(code);
  });

});

// Keep track of connections, to enforce killing them when server must be stopped.
var connections = {};
server.on('connection', function(socket) {
  socket._cid = process.hrtime();
  connections[socket._cid] = socket;

  socket.on('end', function() {
    delete connections[this._cid];
  });
});

['SIGHUP', 'SIGINT', 'SIGQUIT', 'SIGILL', 'SIGTRAP', 'SIGABRT',
 'SIGBUS', 'SIGFPE', 'SIGUSR1', 'SIGSEGV', 'SIGUSR2', 'SIGTERM'].forEach(signal => {
   process.once(signal, () => {
     process.stdout.write(`Got ${signal}, stopping...\n`),
     server.close(() => {
       process.stdout.write('Stopped.\n');
       process.exit(0);
     });

     Object.keys(connections).forEach(cid => connections[cid].destroy());
   });
 });
