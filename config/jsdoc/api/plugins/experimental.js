const modules = {};

exports.defineTags = function(dictionary) {
  dictionary.defineTag('experimental', {
    mustNotHaveValue: true,
    canHaveType: false,
    canHaveName: false,
    onTagged: function(doclet, tag) {
      doclet.experimental = true;
      if (doclet.kind === 'module') {
        modules[doclet.name] = true;
      }
    }
  });
};

exports.handlers = {
  newDoclet: function(e) {
    const doclet = e.doclet;
    if (doclet.kind == 'class') {
      const match = doclet.longname.match(/^module:(.*)[~\.]/);
      if (match && modules[match[1]]) {
        doclet.experimental = true;
      }
    }
  }
};

