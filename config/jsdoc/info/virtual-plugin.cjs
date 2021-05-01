/* eslint-disable import/no-commonjs */

/**
 * Handle the interface and abstract annotations.
 * @param {Object} dictionary The tag dictionary.
 */
exports.defineTags = function (dictionary) {
  const classTag = dictionary.lookUp('class');
  dictionary.defineTag('interface', {
    mustNotHaveValue: true,
    onTagged: function (doclet, tag) {
      classTag.onTagged.apply(this, arguments);
      doclet.virtual = true;
    },
  });
};
