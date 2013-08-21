goog.provide('ol.test.control.Select');

describe('ol.control.Select', function() {
  var map, target, select, features;

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
    var layer = new ol.layer.Vector({source: new ol.source.Vector({})});
    layer.addFeatures(features);
    select = new ol.control.Select({
      layers: [layer],
      map: map
    });
  });

  afterEach(function() {
    goog.dispose(select);
    goog.dispose(map);
    document.body.removeChild(target);
    select = null;
    map = null;
    target = null;
  });

  describe('DOM creation', function() {

    it('creates the expected DOM elements', function() {
      var selectButtons = goog.dom.getElementsByClass('ol-select', target),
          selectButton = selectButtons[0],
          hasUnselectableCls;

      expect(selectButtons.length).to.be(1);

      hasUnselectableCls = goog.dom.classes.has(selectButton,
          'ol-unselectable');
      expect(hasUnselectableCls).to.be(true);
    });

    it('has an .active class only when activated', function() {
      var selectButton = goog.dom.getElementsByClass('ol-select', target)[0];
      select.activate();
      expect(goog.dom.classes.has(selectButton, 'active')).to.be(true);
      select.deactivate();
      expect(goog.dom.classes.has(selectButton, 'active')).to.be(false);
    });

  });

  describe('#activate and #deactivate', function() {
    it('adds a temp layer to the map only when active', function() {
      expect(map.getLayers().getLength()).to.be(0);
      select.activate();
      expect(map.getLayers().getLength()).to.be(1);
      expect(map.getLayers().getAt(0).getTemporary()).to.be(true);
      select.deactivate();
      expect(map.getLayers().getLength()).to.be(0);
    });
    it('has a private property so it knows if it is active', function() {
      expect(select.active_).to.be(false);
      select.activate();
      expect(select.active_).to.be(true);
      select.deactivate();
      expect(select.active_).to.be(false);
    });
    it('toggles active state on click', function() {
      var selectButton = goog.dom.getElementsByClass('ol-select', target)[0];
      var event = new goog.events.BrowserEvent({type: 'click'});
      goog.events.fireListeners(selectButton, event.type, false, event);
      expect(select.active_).to.be(true);
      goog.events.fireListeners(selectButton, event.type, false, event);
      expect(select.active_).to.be(false);
    });
  });

  describe('#select', function() {

    it('toggles selection of features', function() {
      var layer = select.selectionLayers[0];
      select.select([features]);
      expect(goog.object.getCount(layer.featureCache_.idLookup_)).to.be(2);
      select.select([features]);
      expect(goog.object.getCount(layer.featureCache_.idLookup_)).to.be(0);
    });

    it('can append features to an existing selection', function() {
      var layer = select.selectionLayers[0];
      select.select([[features[0]]]);
      select.select([[features[1]]]);
      expect(goog.object.getCount(layer.featureCache_.idLookup_)).to.be(2);
    });

    it('can clear a selection before selecting new features', function() {
      var layer = select.selectionLayers[0];
      select.select([[features[0]]], true);
      select.select([[features[1]]], true);
      expect(goog.object.getCount(layer.featureCache_.idLookup_)).to.be(1);
    });

  });

});

goog.require('goog.dispose');
goog.require('goog.dom');
goog.require('goog.dom.classes');
goog.require('goog.events');
goog.require('goog.events.BrowserEvent');
goog.require('goog.object');
goog.require('ol.Map');
goog.require('ol.control.Select');
goog.require('ol.layer.Vector');
goog.require('ol.parser.GeoJSON');
goog.require('ol.source.Vector');
