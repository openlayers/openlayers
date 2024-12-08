import Map from '../../../../../src/ol/Map.js';
import View from '../../../../../src/ol/View.js';
import DblClickDragZoom from '../../../../../src/ol/interaction/DblClickDragZoom.js';
import VectorLayer from '../../../../../src/ol/layer/Vector.js';
import VectorSource from '../../../../../src/ol/source/Vector.js';

describe('ol.interaction.DblClickDragZoom', function () {
  describe('constructor', function () {
    it('can be constructed without arguments', function () {
      const instance = new DblClickDragZoom();
      expect(instance).to.be.an(DblClickDragZoom);
    });
  });

  describe('handleEvent()', function () {
    let target, map, interaction;

    const width = 360;
    const height = 180;

    beforeEach(function (done) {
      target = document.createElement('div');
      const style = target.style;
      style.position = 'absolute';
      style.left = '0px';
      style.top = '0px';
      style.width = width + 'px';
      style.height = height + 'px';
      document.body.appendChild(target);
      const source = new VectorSource();
      const layer = new VectorLayer({source: source});
      interaction = new DblClickDragZoom();
      map = new Map({
        target: target,
        layers: [layer],
        interactions: [interaction],
        view: new View({
          projection: 'EPSG:4326',
          center: [0, 0],
          resolution: 1,
        }),
      });
      map.getView().setZoom(3);
      map.once('postrender', function () {
        done();
      });
    });

    afterEach(function () {
      disposeMap(map);
    });

    it('does zoom in', function () {
      const down1 = new PointerEvent('pointerdown', {
        clientX: 20,
        clientY: 100,
      });
      const up1 = new PointerEvent('pointerup', {
        clientX: 20,
        clientY: 100,
      });
      const down2 = new PointerEvent('pointerdown', {
        clientX: 20,
        clientY: 100,
      });
      const move1 = new PointerEvent('pointermove', {
        clientX: 20,
        clientY: 80,
      });
      const move2 = new PointerEvent('pointermove', {
        clientX: 20,
        clientY: 60,
      });
      const up2 = new PointerEvent('pointerup', {
        clientX: 20,
        clientY: 50,
      });
      const ignoreMove1 = new PointerEvent('pointermove', {
        clientX: 20,
        clientY: 40,
      });
      const ignoreMove2 = new PointerEvent('pointermove', {
        clientX: 20,
        clientY: 20,
      });

      const view = map.getView();
      expect(view.getZoom()).to.be(3);
      map.getViewport().dispatchEvent(down1);
      document.dispatchEvent(up1);
      map.getViewport().dispatchEvent(down2);
      document.dispatchEvent(move1);
      document.dispatchEvent(move2);
      document.dispatchEvent(up2);
      expect(view.getZoom()).to.be(3.3219280948873626);
      document.dispatchEvent(ignoreMove1);
      document.dispatchEvent(ignoreMove2);
      expect(view.getZoom()).to.be(3.3219280948873626);
    });

    it('does zoom out', function () {
      const down1 = new PointerEvent('pointerdown', {
        clientX: 20,
        clientY: 10,
      });
      const up1 = new PointerEvent('pointerup', {
        clientX: 20,
        clientY: 10,
      });
      const down2 = new PointerEvent('pointerdown', {
        clientX: 20,
        clientY: 10,
      });
      const move1 = new PointerEvent('pointermove', {
        clientX: 20,
        clientY: 20,
      });
      const move2 = new PointerEvent('pointermove', {
        clientX: 20,
        clientY: 50,
      });
      const up2 = new PointerEvent('pointerup', {
        clientX: 20,
        clientY: 50,
      });
      const ignoreMove1 = new PointerEvent('pointermove', {
        clientX: 20,
        clientY: 100,
      });
      const ignoreMove2 = new PointerEvent('pointermove', {
        clientX: 20,
        clientY: 120,
      });

      const view = map.getView();
      expect(view.getZoom()).to.be(3);
      map.getViewport().dispatchEvent(down1);
      document.dispatchEvent(up1);
      map.getViewport().dispatchEvent(down2);
      document.dispatchEvent(move1);
      document.dispatchEvent(move2);
      document.dispatchEvent(up2);
      expect(view.getZoom()).to.be(2.6214883767462704);
      document.dispatchEvent(ignoreMove1);
      document.dispatchEvent(ignoreMove2);
      expect(view.getZoom()).to.be(2.6214883767462704);
    });
  });
});
