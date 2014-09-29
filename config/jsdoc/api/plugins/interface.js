exports.defineTags = function(dictionary) {

  var classTag = dictionary.lookUp('class');
  dictionary.defineTag('interface', {
    mustHaveValue: false,
    onTagged: function(doclet, tag) {
      classTag.onTagged.apply(this, arguments);
      doclet.interface = true;
    }
  });

  var augmentsTag = dictionary.lookUp('augments');
  dictionary.defineTag('implements', {
    mustHaveValue: true,
    onTagged: function(doclet, tag) {
      tag.value = tag.value.match(/^\{?([^\}]*)\}?$/)[1];
      augmentsTag.onTagged.apply(this, arguments);
      if (!doclet.implements) {
        doclet.implements = [];
      }
      doclet.implements.push(tag.value);
    }
  });

};
