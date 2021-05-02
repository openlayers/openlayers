/* eslint-disable import/no-commonjs */

/**
 * @fileoverview  This plugin extracts info from boolean defines.  This only
 * handles boolean defines with the default value in the description.  Default
 * is assumed to be provided with something like "default is `true`" (case
 * insensitive, with or without ticks).
 */

const DEFAULT_VALUE = /default\s+is\s+`?(true|false)`?/i;

/**
 * Hook to define new tags.
 * @param {Object} dictionary The tag dictionary.
 */
exports.defineTags = function (dictionary) {
  dictionary.defineTag('define', {
    canHaveType: true,
    mustHaveValue: true,
    onTagged: function (doclet, tag) {
      const types = tag.value.type.names;
      if (types.length === 1 && types[0] === 'boolean') {
        const match = tag.value.description.match(DEFAULT_VALUE);
        if (match) {
          doclet.define = {
            default: match[1] === 'true',
          };
          doclet.description = tag.value.description;
        }
      }
    },
  });
};
