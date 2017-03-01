

/**
 * Handle the api annotation.
 * @param {Object} dictionary The tag dictionary.
 */
exports.defineTags = function(dictionary) {

  dictionary.defineTag('api', {
    onTagged: function(doclet, tag) {
      doclet.api = tag.text || 'experimental';
    }
  });

};
