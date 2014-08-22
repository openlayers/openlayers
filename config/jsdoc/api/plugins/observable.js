var classes = {};
var observables = {};

exports.handlers = {

  newDoclet: function(e) {
    var doclet = e.doclet;
    if (doclet.kind == 'class') {
      classes[doclet.longname] = doclet;
    }
  },

  parseComplete: function(e) {
    var doclets = e.doclets;
    var cls, doclet, event, i, ii, observable;
    for (i = 0, ii = doclets.length - 1; i < ii; ++i) {
      doclet = doclets[i];
      cls = classes[doclet.longname.split('#')[0]];
      if (typeof doclet.observable == 'string' && cls) {
        var name = doclet.name.replace(/^[sg]et/, '');
        name = name.substr(0, 1).toLowerCase() + name.substr(1);
        var key = doclet.longname.split('#')[0] + '#' + name;
        doclet.observable = key;
        if (!observables[key]) {
          observables[key] = {};
        }
        observable = observables[key];
        observable.name = name;
        observable.readonly = typeof observable.readonly == 'boolean' ?
            observable.readonly : true;
        if (doclet.name.indexOf('get') === 0) {
          observable.type = doclet.returns[0].type;
          observable.description = doclet.returns[0].description;
        } else if (doclet.name.indexOf('set') === 0) {
          observable.readonly = false;
        }
        if (doclet.stability) {
          observable.stability = doclet.stability;
        }
        if (!cls.observables) {
          cls.observables = [];
        }
        observable = observables[doclet.observable];
        if (cls.observables.indexOf(observable) == -1) {
          cls.observables.push(observable);
        }
        if (!cls.fires) {
          cls.fires = [];
        }
        event = 'ol.ObjectEvent#event:change:' + name.toLowerCase();
        if (cls.fires.indexOf(event) == -1) {
          cls.fires.push(event);
        }
      }
    }
  }

};

exports.defineTags = function(dictionary) {
  dictionary.defineTag('observable', {
    mustNotHaveValue: true,
    canHaveType: false,
    canHaveName: false,
    onTagged: function(doclet, tag) {
      doclet.observable = '';
    }
  });
};
