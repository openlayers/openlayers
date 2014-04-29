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

  // get all doclets with the "api" property, but no enums, typedefs and events.
  var docs = data(
      {api: {isString: true}},
      {isEnum: {'!is': true}},
      {kind: {'!is': 'typedef'}},
      {kind: {'!is': 'event'}}
      ).get();

  // get symbols data, filter out those that are members of private classes
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
      extends: doc.augments,
      path: path.join(doc.meta.path, doc.meta.filename)
    };
  });

  process.stdout.write(JSON.stringify({symbols: symbols}, null, 2));

};
