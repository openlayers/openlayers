/**
 * @filedesc
 * Inlines option params from typedefs
 */

const properties = {};

exports.handlers = {

  /**
   * Collects all typedefs, keyed by longname
   * @param {Object} e Event object.
   */
  newDoclet: function(e) {
    if (e.doclet.kind == 'typedef' && e.doclet.properties) {
      properties[e.doclet.longname] = e.doclet.properties;
    }
  },

  /**
   * Adds `options.*` params for options that match the longname of one of the
   * collected typedefs.
   * @param {Object} e Event object.
   */
  parseComplete: function(e) {
    const doclets = e.doclets;
    for (let i = 0, ii = doclets.length; i < ii; ++i) {
      const doclet = doclets[i];
      if (doclet.params) {
        const params = doclet.params;
        for (let j = 0, jj = params.length; j < jj; ++j) {
          const param = params[j];
          if (param.type && param.type.names) {
            const type = param.type.names[0];
            if (type in properties) {
              param.type.names[0] = type;
              params.push.apply(params, properties[type].map(p => {
                const property = Object.assign({}, p);
                property.name = `${param.name}.${property.name}`;
                return property;
              }));
            }
          }
        }
      }
    }
  }

};
