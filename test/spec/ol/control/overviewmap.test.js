goog.provide('ol.test.control.OverviewMap');

goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.control.Control');
goog.require('ol.control.OverviewMap');

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
    map.dispose();
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

});
