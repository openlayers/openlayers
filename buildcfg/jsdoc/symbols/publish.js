/**
 * @fileoverview Generates JSON output based on doclets with the "api" tag.
 */
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

  process.stdout.write('{"symbols": [');

  // stream JSON for each doclet
  docs.forEach(function(doc, i) {
    var metadata = {
      name: doc.longname,
      extends: doc.augments || [],
      package: doc.api,
      path: path.join(doc.meta.path, doc.meta.filename)
    };
    var sep = i > 0 ? ',' : '';
    process.stdout.write(sep + JSON.stringify(metadata));
  });

  process.stdout.write(']}\n');

};
