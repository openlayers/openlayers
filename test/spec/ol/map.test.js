goog.provide('ol.test.Map');

describe('ol.Map', function() {

  describe('constructor', function() {
    it('creates a new map', function() {
      var map = new ol.Map({});
      expect(map).to.be.a(ol.Map);
    });

    it('creates a set of default interactions', function() {
      var map = new ol.Map({});
      var interactions = map.getInteractions();
      var length = interactions.getLength();
      expect(length).to.be.greaterThan(0);

      for (var i = 0; i < length; ++i) {
        expect(interactions.item(i).getMap()).to.be(map);
      }
    });
  });

  describe('#addInteraction()', function() {
    it('adds an interaction to the map', function() {
      var map = new ol.Map({});
      var interaction = new ol.interaction.Interaction();

      var before = map.getInteractions().getLength();
      map.addInteraction(interaction);
      var after = map.getInteractions().getLength();
      expect(after).to.be(before + 1);
      expect(interaction.getMap()).to.be(map);
    });
  });

  describe('#removeInteraction()', function() {
    it('removes an interaction from the map', function() {
      var map = new ol.Map({});
      var interaction = new ol.interaction.Interaction();

      var before = map.getInteractions().getLength();
      map.addInteraction(interaction);

      map.removeInteraction(interaction);
      expect(map.getInteractions().getLength()).to.be(before);

      expect(interaction.getMap()).to.be(null);
    });
  });

  describe('moveend event', function() {

    var target, view, map;

    beforeEach(function() {
      target = document.createElement('div');

      var style = target.style;
      style.position = 'absolute';
      style.left = '-1000px';
      style.top = '-1000px';
      style.width = '360px';
      style.height = '180px';
      document.body.appendChild(target);

      view = new ol.View({
        projection: 'EPSG:4326'
      });
      map = new ol.Map({
        target: target,
        view: view,
        layers: [
          new ol.layer.Tile({
            source: new ol.source.XYZ({
              url: '#{x}/{y}/{z}'
            })
          })
        ]
      });
    });

    afterEach(function() {
      goog.dispose(map);
      document.body.removeChild(target);
    });

    it('is fired only once after view changes', function(done) {
      var center = [10, 20];
      var zoom = 3;
      var calls = 0;
      map.on('moveend', function() {
        ++calls;
        expect(calls).to.be(1);
        expect(view.getCenter()).to.eql(center);
        expect(view.getZoom()).to.be(zoom);
        window.setTimeout(done, 1000);
      });

      view.setCenter(center);
      view.setZoom(zoom);
    });

  });

  describe('#render()', function() {

    var target, map;

    beforeEach(function() {
      target = document.createElement('div');
      var style = target.style;
      style.position = 'absolute';
      style.left = '-1000px';
      style.top = '-1000px';
      style.width = '360px';
      style.height = '180px';
      document.body.appendChild(target);
      map = new ol.Map({
        target: target,
        view: new ol.View({
          projection: 'EPSG:4326',
          center: [0, 0],
          resolution: 1
        })
      });
    });

    afterEach(function() {
      goog.dispose(map);
      document.body.removeChild(target);
    });

    it('results in an postrender event', function(done) {

      map.render();
      map.on('postrender', function(event) {
        expect(event).to.be.a(ol.MapEvent);
        var frameState = event.frameState;
        expect(frameState).not.to.be(null);
        done();
      });

    });

    it('results in an postrender event (for zero height map)', function(done) {
      target.style.height = '0px';
      map.updateSize();

      map.render();
      map.on('postrender', function(event) {
        expect(event).to.be.a(ol.MapEvent);
        var frameState = event.frameState;
        expect(frameState).to.be(null);
        done();
      });

    });

    it('results in an postrender event (for zero width map)', function(done) {
      target.style.width = '0px';
      map.updateSize();

      map.render();
      map.on('postrender', function(event) {
        expect(event).to.be.a(ol.MapEvent);
        var frameState = event.frameState;
        expect(frameState).to.be(null);
        done();
      });

    });

  });

  describe('dispose', function() {
    var map;

    beforeEach(function() {
      map = new ol.Map({
        target: document.createElement('div')
      });
    });

    it('removes the viewport from its parent', function() {
      goog.dispose(map);
      expect(goog.dom.getParentElement(map.getViewport())).to.be(null);
    });
  });

  describe('create interactions', function() {

    var options;

    beforeEach(function() {
      options = {
        altShiftDragRotate: false,
        doubleClickZoom: false,
        keyboard: false,
        mouseWheelZoom: false,
        shiftDragZoom: false,
        dragPan: false,
        pinchRotate: false,
        pinchZoom: false
      };
    });

    describe('create mousewheel interaction', function() {
      it('creates mousewheel interaction', function() {
        options.mouseWheelZoom = true;
        var interactions = ol.interaction.defaults(options);
        expect(interactions.getLength()).to.eql(1);
        expect(interactions.item(0)).to.be.a(ol.interaction.MouseWheelZoom);
      });
    });

    describe('create double click interaction', function() {

      beforeEach(function() {
        options.doubleClickZoom = true;
      });

      describe('default zoomDelta', function() {
        it('create double click interaction with default delta', function() {
          var interactions = ol.interaction.defaults(options);
          expect(interactions.getLength()).to.eql(1);
          expect(interactions.item(0)).to.be.a(ol.interaction.DoubleClickZoom);
          expect(interactions.item(0).delta_).to.eql(1);
        });
      });

      describe('set zoomDelta', function() {
        it('create double click interaction with set delta', function() {
          options.zoomDelta = 7;
          var interactions = ol.interaction.defaults(options);
          expect(interactions.getLength()).to.eql(1);
          expect(interactions.item(0)).to.be.a(ol.interaction.DoubleClickZoom);
          expect(interactions.item(0).delta_).to.eql(7);
        });
      });
    });
  });

});

goog.require('goog.dispose');
goog.require('goog.dom');
goog.require('ol.Map');
goog.require('ol.MapEvent');
goog.require('ol.View');
goog.require('ol.interaction');
goog.require('ol.interaction.Interaction');
goog.require('ol.interaction.DoubleClickZoom');
goog.require('ol.interaction.MouseWheelZoom');
goog.require('ol.layer.Tile');
goog.require('ol.source.XYZ');
