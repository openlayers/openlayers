const classes = {};
const observables = {};

exports.handlers = {

  newDoclet: function(e) {
    const doclet = e.doclet;
    if (doclet.kind == 'class' && !(doclet.longname in classes)) {
      classes[doclet.longname] = doclet;
    }
  },

  parseComplete: function(e) {
    const doclets = e.doclets;
    let cls, doclet, event, i, ii, observable;
    for (i = 0, ii = doclets.length - 1; i < ii; ++i) {
      doclet = doclets[i];
      cls = classes[doclet.longname.split('#')[0]];
      if (typeof doclet.observable == 'string' && cls) {
        let name = doclet.name.replace(/^[sg]et/, '');
        name = name.substr(0, 1).toLowerCase() + name.substr(1);
        const key = doclet.longname.split('#')[0] + '#' + name;
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
        if (observable.type && cls.observables.indexOf(observable) == -1) {
          cls.observables.push(observable);
        }
        if (!cls.fires) {
          cls.fires = [];
        }
        event = 'module:ol/Object.ObjectEvent#event:change:' + name;
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
