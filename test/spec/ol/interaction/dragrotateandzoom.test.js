

goog.require('ol.Map');
goog.require('ol.MapBrowserPointerEvent');
goog.require('ol.View');
goog.require('ol.interaction.DragRotateAndZoom');
goog.require('ol.interaction.Interaction');
goog.require('ol.layer.Vector');
goog.require('ol.pointer.PointerEvent');
goog.require('ol.source.Vector');

describe('ol.interaction.DragRotateAndZoom', function() {

  describe('constructor', function() {

    it('can be constructed without arguments', function() {
      var instance = new ol.interaction.DragRotateAndZoom();
      expect(instance).to.be.an(ol.interaction.DragRotateAndZoom);
    });

  });

  describe('#handleDragEvent_()', function() {

    var target, map, interaction;

    var width = 360;
    var height = 180;

    beforeEach(function(done) {
      target = document.createElement('div');
      var style = target.style;
      style.position = 'absolute';
      style.left = '-1000px';
      style.top = '-1000px';
      style.width = width + 'px';
      style.height = height + 'px';
      document.body.appendChild(target);
      var source = new ol.source.Vector();
      var layer = new ol.layer.Vector({source: source});
      interaction = new ol.interaction.DragRotateAndZoom();
      map = new ol.Map({
        target: target,
        layers: [layer],
        interactions: [interaction],
        view: new ol.View({
          projection: 'EPSG:4326',
          center: [0, 0],
          resolution: 1
        })
      });
      map.once('postrender', function() {
        done();
      });
    });

    afterEach(function() {
      map.dispose();
      document.body.removeChild(target);
    });

    it('does not rotate when rotation is disabled on the view', function() {
      var event = new ol.MapBrowserPointerEvent('pointermove', map,
          new ol.pointer.PointerEvent('pointermove', {clientX: 20, clientY: 10}, {pointerType: 'mouse'}),
          true);
      interaction.lastAngle_ = Math.PI;
      var spy = sinon.spy(ol.interaction.Interaction, 'rotateWithoutConstraints');
      interaction.handleDragEvent_(event);
      expect(spy.callCount).to.be(1);
      expect(interaction.lastAngle_).to.be(-0.8308214428190254);
      map.setView(new ol.View({
        projection: 'EPSG:4326',
        center: [0, 0],
        resolution: 1,
        enableRotation: false
      }));
      event = new ol.MapBrowserPointerEvent('pointermove', map,
          new ol.pointer.PointerEvent('pointermove', {clientX: 24, clientY: 16}, {pointerType: 'mouse'}),
          true);
      interaction.handleDragEvent_(event);
      expect(spy.callCount).to.be(1);
      ol.interaction.Interaction.rotateWithoutConstraints.restore();
    });
  });

});
