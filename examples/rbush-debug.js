goog.require('ol.Map');
goog.require('ol.structs.RBush');
goog.require('ol.format.GeoJSON');


var rbush = new ol.structs.RBush();
var format = new ol.format.GeoJSON();

var objects = {};
$.getJSON('actions.json', function(data) {
  for (var i = 0; i < data.length; i++) {
    var action = data[i].action;
    var features = format.readFeatures(data[i].features);
    for (var j = 0; j < features.length; j++) {
      var id = features[j].getId();
      if (action == 'add') {
        objects[id] = {
          id: id
        };
        //if (id == '-ijAXiXpSQ69sJQeivZOyw') debugger;
        rbush.insert(features[j].getGeometry().getExtent(), objects[id]);
        //rbush.assertValid();
      } else if (action == 'remove') {
        //if (id == '-ijAXiXpSQ69sJQeivZOyw') debugger;
        rbush.remove(objects[id]);
        //rbush.assertValid();
      }
    }
  }
  console.log('done');
});
