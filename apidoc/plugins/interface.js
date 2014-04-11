var util = require('util');
exports.defineTags = function(dictionary) {

  var classTag = dictionary.lookUp('class');
  dictionary.defineTag('interface', {
    mustHaveValue: false,
    onTagged: function(doclet, tag) {
      classTag.onTagged.apply(this, arguments);
      doclet.interface = true;
    }
  });

  dictionary.defineTag('implements', {
    mustHaveValue: true,
    onTagged: function(doclet, tag) {
      if (!doclet.implements) {
        doclet.implements = [];
      }
      doclet.implements.push(tag.value.match(/^{(.*)}$/)[1]);
    }
  });

};
