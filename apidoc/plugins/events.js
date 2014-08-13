var events = {};
var classes = {};

exports.handlers = {

  newDoclet: function(e) {
    var doclet = e.doclet;
    var cls;
    if (doclet.kind == 'event') {
      cls = doclet.longname.split('#')[0];
      if (!(cls in events)) {
        events[cls] = [];
      }
      events[cls].push(doclet.longname);
    } else if (doclet.kind == 'class') {
      classes[doclet.longname] = doclet;
    }
  },

  parseComplete: function(e) {
    var doclets = e.doclets;
    var doclet, i, ii, j, jj, event, fires;
    for (i = 0, ii = doclets.length - 1; i < ii; ++i) {
      doclet = doclets[i];
      if (doclet.fires) {
        if (doclet.kind == 'class') {
          fires = [];
          for (j = 0, jj = doclet.fires.length; j < jj; ++j) {
            event = doclet.fires[j].replace('event:', '');
            if (events[event]) {
              fires.push.apply(fires, events[event]);            
            } else {
              fires.push(doclet.fires[j]);
            }
          }
          doclet.fires = fires;
        }
      }
    }
  }

};

