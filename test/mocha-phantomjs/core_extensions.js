(function(){

  // A shim for non ES5 supporting browsers, like PhantomJS. Lovingly inspired by:
  // http://www.angrycoding.com/2011/09/to-bind-or-not-to-bind-that-is-in.html
  if (!('bind' in Function.prototype)) {
    Function.prototype.bind = function() {
      var funcObj = this;
      var extraArgs = Array.prototype.slice.call(arguments);
      var thisObj = extraArgs.shift();
      return function() {
        return funcObj.apply(thisObj, extraArgs.concat(Array.prototype.slice.call(arguments)));
      };
    };
  }

  // Mocha needs process.stdout.write in order to change the cursor position. However,
  // PhantomJS console.log always puts a new line character when logging and no STDOUT or
  // stream access is available, outside writing to /dev/stdout, etc. To work around
  // this, runner classes typically override `process.stdout.write` as needed to simulate
  // write to standard out using cursor commands.
  process.cursor = {
    count:           0,
    margin:          0,
    buffer:          '',
    CRCleanup:       false,
    CRMatcher:       undefined,
    CRCleaner:       undefined,
    hide:            '\u001b[?25l',
    show:            '\u001b[?25h',
    deleteLine:      '\u001b[2K',
    beginningOfLine: '\u001b[0G',
    up:              '\u001b[A',
    down:            '\u001b[B',
    forward:         '\u001b[C',
    forwardN:        function(n){ return '\u001b[' + n + 'C'; },
    backward:        '\u001b[D',
    nextLine:        '\u001b[E',
    previousLine:    '\u001b[F'
  }
  process.stdout.columns = 0;
  process.stdout.write = function(string) { console.log(string); }

  // Mocha needs the formating feature of console.log so copy node's format function and
  // monkey-patch it into place. This code is copied from node's, links copyright applies.
  // https://github.com/joyent/node/blob/master/lib/util.js
  console.format = function(f) {
    if (typeof f !== 'string') {
      var objects = [];
      for (var i = 0; i < arguments.length; i++) {
        objects.push(JSON.stringify(arguments[i]));
      }
      return objects.join(' ');
    }
    var i = 1;
    var args = arguments;
    var len = args.length;
    var str = String(f).replace(/%[sdj%]/g, function(x) {
      if (x === '%%') return '%';
      if (i >= len) return x;
      switch (x) {
        case '%s': return String(args[i++]);
        case '%d': return Number(args[i++]);
        case '%j': return JSON.stringify(args[i++]);
        default:
          return x;
      }
    });
    for (var x = args[i]; i < len; x = args[++i]) {
      if (x === null || typeof x !== 'object') {
        str += ' ' + x;
      } else {
        str += ' ' + JSON.stringify(x);
      }
    }
    return str;
  };
  var origError = console.error;
  console.error = function(){ origError.call(console, console.format.apply(console, arguments)); };
  var origLog = console.log;
  console.log = function(){ origLog.call(console, console.format.apply(console, arguments)); };

})();




