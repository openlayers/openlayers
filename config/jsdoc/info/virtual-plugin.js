/**
 * Handle the interface and abstract annotations.
 * @param {Object} dictionary The tag dictionary.
 */
exports.defineTags = function(dictionary) {

  var classTag = dictionary.lookUp('class');
  dictionary.defineTag('interface', {
    mustHaveValue: false,
    onTagged: function(doclet, tag) {
      classTag.onTagged.apply(this, arguments);
      doclet.virtual = true;
    }
  });

};
