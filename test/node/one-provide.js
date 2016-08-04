const assert = require('assert');
const fs = require('fs');
const glob = require('glob');
const path = require('path');

const src = path.join(__dirname, '..', '..', 'src');

const PROVIDE_RE = /^goog.provide\('(.*)'\);/

describe('each file', () => {

  const provides = {};

  before(done => {
    glob('**/*.js', {cwd: src}, function(err, files) {
      if (err) {
        return done(err);
      }
      let count = files.length;
      let called = false;
      files.forEach(file => {
        fs.readFile(path.join(src, file), (err, data) => {
          if (!called && err) {
            called = true;
            return done(err);
          }
          provides[file] = [];
          String(data).split('\n').forEach(line => {
            const match = line.match(PROVIDE_RE);
            if (match) {
              provides[file].push(match[1]);
            }
          });
          --count;
          if (count === 0 && !called) {
            called = true;
            return done();
          }
        });
      });
    });
  });

  it('has a single provide', () => {
    for (let file in provides) {
      assert.equal(provides[file].length, 1, 'expected a single provide: ' + file);
    }
  });

  it('has a path that maps to the provide', () => {
    for (let file in provides) {
      const provide = provides[file][0];
      let ext;
      if (file.endsWith('index.js')) {
        ext = path.sep + 'index.js';
      } else {
        ext = '.js';
      }
      const mapped = provide.split('.').map(part => part.toLowerCase()).join(path.sep) + ext;
      assert.equal(mapped, file, 'expected provide to be like the path: ' + file);
    }
  });

});
