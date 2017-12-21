import Map from '../../../../src/ol/Map.js';
import MapBrowserPointerEvent from '../../../../src/ol/MapBrowserPointerEvent.js';
import _ol_View_ from '../../../../src/ol/View.js';
import DragRotateAndZoom from '../../../../src/ol/interaction/DragRotateAndZoom.js';
import Interaction from '../../../../src/ol/interaction/Interaction.js';
import _ol_layer_Vector_ from '../../../../src/ol/layer/Vector.js';
import _ol_pointer_PointerEvent_ from '../../../../src/ol/pointer/PointerEvent.js';
import _ol_source_Vector_ from '../../../../src/ol/source/Vector.js';

describe('ol.interaction.DragRotateAndZoom', function() {

  describe('constructor', function() {

    it('can be constructed without arguments', function() {
      var instance = new DragRotateAndZoom();
      expect(instance).to.be.an(DragRotateAndZoom);
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
      var source = new _ol_source_Vector_();
      var layer = new _ol_layer_Vector_({source: source});
      interaction = new DragRotateAndZoom();
      map = new Map({
        target: target,
        layers: [layer],
        interactions: [interaction],
        view: new _ol_View_({
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
      var event = new MapBrowserPointerEvent('pointermove', map,
          new _ol_pointer_PointerEvent_('pointermove', {clientX: 20, clientY: 10}, {pointerType: 'mouse'}),
          true);
      interaction.lastAngle_ = Math.PI;
      var spy = sinon.spy(Interaction, 'rotateWithoutConstraints');
      interaction.handleDragEvent_(event);
      expect(spy.callCount).to.be(1);
      expect(interaction.lastAngle_).to.be(-0.8308214428190254);
      map.setView(new _ol_View_({
        projection: 'EPSG:4326',
        center: [0, 0],
        resolution: 1,
        enableRotation: false
      }));
      event = new MapBrowserPointerEvent('pointermove', map,
          new _ol_pointer_PointerEvent_('pointermove', {clientX: 24, clientY: 16}, {pointerType: 'mouse'}),
          true);
      interaction.handleDragEvent_(event);
      expect(spy.callCount).to.be(1);
      Interaction.rotateWithoutConstraints.restore();
    });
  });

});
