goog.provide('ol.test.control.OverviewMap');

describe('ol.control.OverviewMap', function() {
  var map, target;

  beforeEach(function() {
    target = document.createElement('div');
    document.body.appendChild(target);
    map = new ol.Map({
      target: target
    });
  });

  afterEach(function() {
    goog.dispose(map);
    document.body.removeChild(target);
    map = null;
    target = null;
  });

  describe('constructor', function() {
    it('creates an overview map with the default options', function() {
      var control = new ol.control.OverviewMap();
      expect(control).to.be.a(ol.control.OverviewMap);
      expect(control).to.be.a(ol.control.Control);
    });
  });

  describe('setMap()', function() {

    it('keeps ovmap view rotation in sync with map view rotation', function() {
      var view = new ol.View({
        center: [0, 0],
        zoom: 0,
        rotation: 0
      });
      map.setView(view);

      var control = new ol.control.OverviewMap();
      map.addControl(control);
      var ovView = control.ovmap_.getView();
      expect(ovView.getRotation()).to.be(0);

      view.setRotation(Math.PI / 4);
      expect(ovView.getRotation()).to.be(Math.PI / 4);
    });

    it('maintains rotation in sync if view added later', function() {
      var control = new ol.control.OverviewMap();
      map.addControl(control);
      var ovView = control.ovmap_.getView();
      expect(ovView.getRotation()).to.be(0);

      var view = new ol.View({
        center: [0, 0],
        zoom: 0,
        rotation: 0
      });
      map.setView(view);
      view.setRotation(Math.PI / 4);
      expect(ovView.getRotation()).to.be(Math.PI / 4);
    });

    it('stops listening to old maps', function() {
      var control = new ol.control.OverviewMap();
      var ovView = control.ovmap_.getView();

      var view = new ol.View({
        center: [0, 0],
        zoom: 0,
        rotation: 0
      });
      map.setView(view);
      map.addControl(control);

      view.setRotation(Math.PI / 8);
      expect(ovView.getRotation()).to.be(Math.PI / 8);

      map.removeControl(control);

      view.setRotation(Math.PI / 4);
      expect(ovView.getRotation()).to.be(Math.PI / 8);
    });

  });
  describe('setLayers()', function() {

    it('updates the layers of the overview map', function() {

      var firstWmsSource = new ol.source.TileWMS({
        url: 'http://demo.boundlessgeo.com/geoserver/wms',
        params: {'LAYERS': 'ne:ne'},
        serverType: 'geoserver',
        crossOrigin: ''
      });

      var firstWmsLayer = new ol.layer.Tile({
        source: firstWmsSource
      });

      var control = new ol.control.OverviewMap({layers: [firstWmsLayer]});
      expect(control).to.be.a(ol.control.OverviewMap);
      expect(control).to.be.a(ol.control.Control);

      var view = new ol.View({
        center: [0, 0],
        zoom: 1
      });

      var firstLayerGroup = new ol.layer.Group({
        layers: [firstWmsLayer]
      });
      map.setView(view);
      map.setLayerGroup(firstLayerGroup);
      map.addControl(control);

      var ovLayers = control.ovmap_.getLayers();
      expect(ovLayers.length === 1);
      expect(ovLayers.item(0)).to.be(firstWmsLayer);

      var secondWmsSource = new ol.source.TileWMS({
        url: 'http://demo.boundlessgeo.com/geoserver/wms',
        params: {'LAYERS': 'dark:dark'},
        serverType: 'geoserver',
        crossOrigin: ''
      });

      var secondWmsLayer = new ol.layer.Tile({
        source: secondWmsSource
      });

      var secondLayerGroup = new ol.layer.Group({
        layers: [secondWmsLayer]
      });
      map.setLayerGroup(secondLayerGroup);

      control.setLayers([secondWmsLayer]);

      ovLayers = control.ovmap_.getLayers();
      expect(ovLayers.length === 1);
      expect(ovLayers.item(0)).to.be(secondWmsLayer);

    });
  });

});

goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.control.Control');
goog.require('ol.control.OverviewMap');
goog.require('ol.source.TileWMS');
goog.require('ol.layer.Tile');
goog.require('ol.layer.Group');
