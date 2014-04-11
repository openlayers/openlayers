/*
 * This plugin removes unexported symbols from the documentation.
 * Unexported modules linked from @param or @fires will be marked unexported,
 * and the documentation will not contain the constructor. Everything else is
 * marked undocumented, which will remove it from the docs.
 */

var api = [];
var unexported = [];
var observablesByClass = {};

function collectExports(source) {
  var symbols = JSON.parse(source).symbols;
  for (var i = 0, ii = symbols.length; i < ii; ++i) {
    api.push(symbols[i].name);
  }
}

var encoding = env.conf.encoding || 'utf8';
var fs = require('jsdoc/fs');
collectExports(fs.readFileSync('build/symbols.json', encoding));


exports.handlers = {
  
  newDoclet: function(e) {
    var i, ii, j, jj;
    if (e.doclet.meta.filename == "olx.js" && e.doclet.longname != 'olx') {
      api.push(e.doclet.longname);
    }
    if (e.doclet.longname.indexOf('oli.') === 0) {
      unexported.push(e.doclet.longname.replace(/^oli\./, 'ol.'));
    }
    if (api.indexOf(e.doclet.longname) > -1) {
      var names, name;
      var params = e.doclet.params;
      if (params) {
        for (i = 0, ii = params.length; i < ii; ++i) {
          names = params[i].type.names;
          if (names) {
            for (j = 0, jj=names.length; j < jj; ++j) {
              name = names[j];
              if (unexported.indexOf(name) === -1) {
                unexported.push(name);
              }
            }
          }
        }
      }
      var links = e.doclet.comment.match(/\{@link ([^\}]*)\}/g);
      if (links) {
        for (i=0, ii=links.length; i < ii; ++i) {
          var link = links[i].match(/\{@link (.*)\}/)[1];
          if (unexported.indexOf(link) === -1) {
            unexported.push(link);
          }
        }
      }
    }
    if (e.doclet.observables) {
      var observables = observablesByClass[e.doclet.longname] = [];
      for (i = e.doclet.observables.length - 1; i >= 0; --i) {
         observables.push(e.doclet.observables[i].name);
      }
    }
  },
  
  parseComplete: function(e) {
    for (var j = e.doclets.length - 1; j >= 0; --j) {
      var doclet = e.doclets[j];
      if (doclet.meta.filename == 'olx.js' && doclet.kind == 'typedef') {
        for (var i = e.doclets.length - 1; i >= 0; --i) {
          var propertyDoclet = e.doclets[i];
          if (propertyDoclet.memberof == doclet.longname) {
            if (!doclet.properties) {
              doclet.properties = [];
            }
            doclet.properties.unshift(propertyDoclet);
            e.doclets.splice(i, 1);
          }
        }
      }
      if (doclet.kind == 'namespace' || doclet.kind == 'event' || doclet.fires) {
        continue;
      }
      var fqn = doclet.longname;
      if (fqn) {
        var getterOrSetter = fqn.match(/([^#]*)#[gs]et(.*)/);
        if (getterOrSetter) {
          var observables = observablesByClass[getterOrSetter[1]];
          if (observables && observables.indexOf(getterOrSetter[2].toLowerCase()) > -1) {
            // Always document getters/setters of observables
            continue;
          }
        }
        if (doclet.memberof && doclet.memberof.indexOf('oli.') === 0 &&
            unexported.indexOf(doclet.memberof) > -1) {
          // Always document members of referenced oli interfaces
          continue;
        }
        doclet.unexported = (api.indexOf(fqn) === -1 && unexported.indexOf(fqn) !== -1);
        if (api.indexOf(fqn) === -1 && unexported.indexOf(fqn) === -1) {
          e.doclets.splice(j, 1);
        }
      }
    }
  }

};
