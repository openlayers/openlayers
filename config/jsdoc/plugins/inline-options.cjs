/* eslint-disable import/no-commonjs */

/**
 * @fileoverview
 * Inlines option params from typedefs
 */

const docletInfos = {};

/**
 * This parses the comment for `@template` annotations and returns an object with name / type pairs for all template
 * values
 * @param {string} comment a jsdoc comment to parse
 * @return {Object<string, string>} results
 */
function parseCommentForTemplates(comment) {
  let remainingText = comment;
  const results = {};
  while (true) {
    const templateMatch = remainingText.match(/\* @template\s*([\s\S]*)/);

    if (!templateMatch) {
      return results;
    }

    remainingText = templateMatch[1];

    let type = '*';

    if (remainingText[0] === '{') {
      let index = 1;
      let openParenthesis = 1;
      while (openParenthesis > 0) {
        if (remainingText[index] === '{') {
          openParenthesis++;
        } else if (remainingText[index] === '}') {
          openParenthesis--;
        }
        index++;
      }
      type = remainingText.slice(1, index - 1);
      remainingText = remainingText.slice(index);
    }

    const name = remainingText.match(/\s*(\S*)/)[1];

    results[name] = type;
  }
}

exports.handlers = {
  /**
   * Collects all typedefs, keyed by longname
   * @param {Object} e Event object.
   */
  newDoclet: function (e) {
    if (e.doclet.kind == 'typedef' && e.doclet.properties) {
      docletInfos[e.doclet.longname] = {
        properties: e.doclet.properties,
      };
    }
  },

  /**
   * Adds `options.*` params for options that match the longname of one of the
   * collected typedefs.
   * @param {Object} e Event object.
   */
  parseComplete: function (e) {
    const doclets = e.doclets;

    // gather type information
    for (let i = 0, ii = doclets.length; i < ii; ++i) {
      const doclet = doclets[i];
      if (doclet.longname in docletInfos) {
        docletInfos[doclet.longname].type = doclet.type;
      }
    }

    // inline options
    for (let i = 0, ii = doclets.length; i < ii; ++i) {
      const doclet = doclets[i];
      if (doclet.params) {
        const params = doclet.params;
        for (let j = 0, jj = params.length; j < jj; ++j) {
          const param = params[j];
          if (param.type && param.type.names) {
            let type = param.type.names[0];
            const genericMatches = type.match(/(^.*?)\.?<.*>/);
            if (genericMatches) {
              type = genericMatches[1];
            }
            if (type in docletInfos) {
              const templateInfo = parseCommentForTemplates(doclet.comment);
              param.type = docletInfos[type].type;
              params.push.apply(
                params,
                docletInfos[type].properties.map((p) => {
                  const property = Object.assign({}, p);
                  property.name = `${param.name}.${property.name}`;
                  if (property.type.names[0] in templateInfo) {
                    property.type.names[0] =
                      templateInfo[property.type.names[0]];
                  }
                  return property;
                })
              );
            }
          }
        }
      }
    }
  },
};
