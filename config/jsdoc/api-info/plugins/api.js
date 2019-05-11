
/**
 * Handle the api annotation.
 * @param {Object} dictionary The tag dictionary.
 */
exports.defineTags = dictionary => {

  dictionary.defineTag('api', {
    onTagged: (doclet, tag) => {
      doclet.api = true;
    }
  });

};

