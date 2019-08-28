import Map from '../../../../src/ol/Map.js';
import MapBrowserPointerEvent from '../../../../src/ol/MapBrowserPointerEvent.js';
import View from '../../../../src/ol/View.js';
import DragRotateAndZoom from '../../../../src/ol/interaction/DragRotateAndZoom.js';
import VectorLayer from '../../../../src/ol/layer/Vector.js';
import Event from '../../../../src/ol/events/Event.js';
import VectorSource from '../../../../src/ol/source/Vector.js';

describe('ol.interaction.DragRotateAndZoom', function() {

  describe('constructor', function() {

    it('can be constructed without arguments', function() {
      const instance = new DragRotateAndZoom();
      expect(instance).to.be.an(DragRotateAndZoom);
    });

  });

  describe('#handleDragEvent()', function() {

    let target, map, interaction;

    const width = 360;
    const height = 180;

    beforeEach(function(done) {
      target = document.createElement('div');
      const style = target.style;
      style.position = 'absolute';
      style.left = '-1000px';
      style.top = '-1000px';
      style.width = width + 'px';
      style.height = height + 'px';
      document.body.appendChild(target);
      const source = new VectorSource();
      const layer = new VectorLayer({source: source});
      interaction = new DragRotateAndZoom();
      map = new Map({
        target: target,
        layers: [layer],
        interactions: [interaction],
        view: new View({
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
      const pointerEvent = new Event();
      pointerEvent.type = 'pointermove';
      pointerEvent.clientX = 20;
      pointerEvent.clientY = 10;
      pointerEvent.pointerType = 'mouse';
      let event = new MapBrowserPointerEvent('pointermove', map, pointerEvent, true);
      interaction.lastAngle_ = Math.PI;

      let callCount = 0;

      let view = map.getView();
      view.on('change:rotation', function() {
        callCount++;
      });

      interaction.handleDragEvent(event);
      expect(callCount).to.be(1);
      expect(interaction.lastAngle_).to.be(-0.8308214428190254);

      callCount = 0;
      view = new View({
        projection: 'EPSG:4326',
        center: [0, 0],
        resolution: 1,
        enableRotation: false
      });
      map.setView(view);
      view.on('change:rotation', function() {
        callCount++;
      });

      pointerEvent.type = 'pointermove';
      pointerEvent.clientX = 24;
      pointerEvent.clientY = 16;
      pointerEvent.pointerType = 'mouse';
      event = new MapBrowserPointerEvent('pointermove', map, pointerEvent, true);

      interaction.handleDragEvent(event);
      expect(callCount).to.be(0);
    });
  });

});
