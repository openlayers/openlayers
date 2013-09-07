goog.provide('ol.test.interaction.Select');

describe('ol.interaction.Select', function() {
  var map, target, select, vector, features;

  beforeEach(function() {
    target = document.createElement('div');
    target.style.width = '256px';
    target.style.height = '256px';
    document.body.appendChild(target);
    map = new ol.Map({
      target: target
    });
    features = ol.parser.GeoJSON.read(JSON.stringify({
      'type': 'FeatureCollection',
      'features': [{
        'type': 'Feature',
        'geometry': {
          'type': 'Point',
          'coordinates': [-1, 1]
        }
      }, {
        'type': 'Feature',
        'geometry': {
          'type': 'Point',
          'coordinates': [1, -1]
        }
      }]
    }));
    vector = new ol.layer.Vector({source: new ol.source.Vector({})});
    vector.addFeatures(features);
    select = new ol.interaction.Select({
      layerFilter: function(layer) { return layer === vector; }
    });
    map.getInteractions().push(select);
  });

  afterEach(function() {
    goog.dispose(select);
    goog.dispose(map);
    document.body.removeChild(target);
    select = null;
    map = null;
    target = null;
  });

  describe('#select', function() {

    it('toggles selection of features', function() {
      select.select(map, [features], [vector]);
      var layer = select.selectionLayers[goog.getUid(map)]
          .layers[goog.getUid(vector)];
      expect(goog.object.getCount(layer.featureCache_.idLookup_)).to.be(2);
      select.select(map, [features], [vector]);
      expect(goog.object.getCount(layer.featureCache_.idLookup_)).to.be(0);
    });

    it('can append features to an existing selection', function() {
      select.select(map, [[features[0]]], [vector]);
      select.select(map, [[features[1]]], [vector]);
      var layer = select.selectionLayers[goog.getUid(map)]
          .layers[goog.getUid(vector)];
      expect(goog.object.getCount(layer.featureCache_.idLookup_)).to.be(2);
    });

    it('can clear a selection before selecting new features', function() {
      select.select(map, [[features[0]]], [vector], true);
      select.select(map, [[features[1]]], [vector], true);
      var layer = select.selectionLayers[goog.getUid(map)]
          .layers[goog.getUid(vector)];
      expect(goog.object.getCount(layer.featureCache_.idLookup_)).to.be(1);
    });

  });

});

goog.require('goog.dispose');
goog.require('goog.object');
goog.require('ol.Map');
goog.require('ol.interaction.Select');
goog.require('ol.layer.Vector');
goog.require('ol.parser.GeoJSON');
goog.require('ol.source.Vector');
