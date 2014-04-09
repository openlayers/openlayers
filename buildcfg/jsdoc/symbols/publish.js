/**
 * @fileoverview Generates JSON output based on doclets with the "api" tag.
 */
var assert = require('assert');
var fs = require('fs');
var path = require('path');


/**
 * Publish hook for the JSDoc template.  Writes to JSON stdout.
 * @param {function} data The root of the Taffy DB containing doclet records.
 * @param {Object} opts Options.
 */
exports.publish = function(data, opts) {
  var cwd = process.cwd();

  // get all doclets with the "api" property.
  var docs = data({api: {isString: true}}).get();

  // get sorted symbols, filter out those that are members of private classes
  var symbols = docs.filter(function(doc) {
    var include = true;
    var constructor = doc.memberof;
    if (constructor && constructor.substr(-1) === '_') {
      assert.strictEqual(doc.inherited, true,
          'Unexpected export on private class: ' + doc.longname);
      include = false;
    }
    return include;
  }).map(function(doc) {
    return {
      name: doc.longname,
      path: path.join(doc.meta.path, doc.meta.filename)
    };
  }).sort(function(a, b) {
    return a.name < b.name ? -1 : 1;
  });

  process.stdout.write(JSON.stringify({symbols: symbols}, null, 2));

};
