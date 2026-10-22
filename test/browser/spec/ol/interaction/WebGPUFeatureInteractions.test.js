import {assert} from 'chai';
import Feature from '../../../../../src/ol/Feature.js';
import Map from '../../../../../src/ol/Map.js';
import MapBrowserEvent from '../../../../../src/ol/MapBrowserEvent.js';
import View from '../../../../../src/ol/View.js';
import Point from '../../../../../src/ol/geom/Point.js';
import Polygon from '../../../../../src/ol/geom/Polygon.js';
import Modify from '../../../../../src/ol/interaction/Modify.js';
import Select from '../../../../../src/ol/interaction/Select.js';
import Translate from '../../../../../src/ol/interaction/Translate.js';
import VectorLayer from '../../../../../src/ol/layer/Vector.js';
import WebGPUVectorLayer from '../../../../../src/ol/layer/WebGPUVector.js';
import VectorSource from '../../../../../src/ol/source/Vector.js';

where('WebGPU').describe('interactions with a WebGPU layer', function () {
  const width = 360;
  const height = 180;

  /** @type {Map} */
  let map;
  /** @type {WebGPUVectorLayer} */
  let layer;
  /** @type {Feature} */
  let below;
  /** @type {Feature} */
  let above;

  beforeEach(async function () {
    const target = document.createElement('div');
    target.style.position = 'absolute';
    target.style.left = '-1000px';
    target.style.top = '-1000px';
    target.style.width = width + 'px';
    target.style.height = height + 'px';
    document.body.appendChild(target);
    below = new Feature({geometry: rectangle(-40, -40, 20, 20), name: 'below'});
    above = new Feature({geometry: rectangle(-20, -20, 40, 40), name: 'above'});
    layer = new WebGPUVectorLayer({
      source: new VectorSource({features: [below, above]}),
      style: {'fill-color': 'red'},
    });
    map = new Map({
      target,
      layers: [layer],
      view: new View({center: [0, 0], resolution: 1}),
    });
    await new Promise((resolve) => map.once('rendercomplete', resolve));
  });

  afterEach(function () {
    disposeMap(map);
  });

  /**
   * @param {number} minX Left.
   * @param {number} minY Bottom.
   * @param {number} maxX Right.
   * @param {number} maxY Top.
   * @return {Polygon} Rectangle.
   */
  function rectangle(minX, minY, maxX, maxY) {
    return new Polygon([
      [
        [minX, minY],
        [maxX, minY],
        [maxX, maxY],
        [minX, maxY],
        [minX, minY],
      ],
    ]);
  }

  /**
   * Dispatches a map browser event at an offset from the map center, with
   * y pointing up.
   * @param {string} type Event type.
   * @param {number} x Horizontal offset from the center.
   * @param {number} y Vertical offset from the center.
   * @param {boolean} [shiftKey] Whether shift is pressed.
   */
  function simulateEvent(type, x, y, shiftKey = false) {
    const viewport = map.getViewport();
    const position = viewport.getBoundingClientRect();
    const event = new MapBrowserEvent(type, map, {
      type,
      target: viewport.firstChild,
      pointerId: 0,
      isPrimary: true,
      button: 0,
      clientX: position.left + x + width / 2,
      clientY: position.top - y + height / 2,
      shiftKey,
      preventDefault: () => {},
    });
    map.handleMapBrowserEvent(event);
  }

  /**
   * @param {function(): boolean} condition Condition to wait for.
   * @return {Promise<void>} Resolves once the condition holds.
   */
  async function until(condition) {
    for (let i = 0; i < 100 && !condition(); ++i) {
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
    assert.isTrue(condition());
  }

  describe('Select', function () {
    it('selects the topmost feature of the layer on singleclick', async function () {
      const select = new Select();
      map.addInteraction(select);
      simulateEvent('singleclick', 30, 30);
      await until(() => select.getFeatures().getLength() === 1);
      assert.strictEqual(select.getFeatures().item(0), above);
      assert.strictEqual(select.getLayer(above), layer);
    });

    it('replaces the selection, and clears it where nothing is hit', async function () {
      const select = new Select();
      map.addInteraction(select);
      simulateEvent('singleclick', -35, -35);
      await until(() => select.getFeatures().item(0) === below);
      simulateEvent('singleclick', 30, 30);
      await until(() => select.getFeatures().item(0) === above);
      assert.strictEqual(select.getFeatures().getLength(), 1);
      simulateEvent('singleclick', 100, 70);
      await until(() => select.getFeatures().getLength() === 0);
    });

    it('selects every feature under the pointer with multi', async function () {
      const select = new Select({multi: true});
      map.addInteraction(select);
      simulateEvent('singleclick', 0, 0);
      await until(() => select.getFeatures().getLength() === 2);
      assert.sameMembers(select.getFeatures().getArray(), [above, below]);
    });

    it('leaves layers outside its layer filter alone', function () {
      const other = new VectorLayer({source: new VectorSource()});
      map.addLayer(other);
      const select = new Select({layers: [other]});
      map.addInteraction(select);
      assert.isFalse(layer.hasListener('featuresingleclick'));
    });

    it('stops listening to the layer when removed from the map', function () {
      const select = new Select();
      map.addInteraction(select);
      assert.isTrue(layer.hasListener('featuresingleclick'));
      map.removeInteraction(select);
      assert.isFalse(layer.hasListener('featuresingleclick'));
    });
  });

  describe('Translate', function () {
    it('drags the feature that was hovered', async function () {
      const translate = new Translate();
      map.addInteraction(translate);
      const start = above.getGeometry().getExtent().slice();
      const hovered = new Promise((resolve) =>
        layer.once('featurehover', resolve),
      );
      simulateEvent('pointermove', 30, 30);
      await hovered;
      simulateEvent('pointerdown', 30, 30);
      simulateEvent('pointerdrag', 40, 35);
      simulateEvent('pointerup', 40, 35);
      const end = above.getGeometry().getExtent();
      assert.closeTo(end[0] - start[0], 10, 1e-6);
      assert.closeTo(end[1] - start[1], 5, 1e-6);
    });
  });

  describe('Modify', function () {
    it('grabs a point by the circle drawn for it when hitDetection is the WebGPU layer', async function () {
      const point = new Feature({geometry: new Point([100, 50])});
      const pointLayer = new WebGPUVectorLayer({
        source: new VectorSource({features: [point]}),
        style: {'circle-radius': 12, 'circle-fill-color': 'blue'},
      });
      map.addLayer(pointLayer);
      await new Promise((resolve) => map.once('rendercomplete', resolve));
      const modify = new Modify({
        source: pointLayer.getSource(),
        hitDetection: pointLayer,
        pixelTolerance: 3,
      });
      map.addInteraction(modify);
      const hovered = new Promise((resolve) =>
        pointLayer.once('featurehover', resolve),
      );
      simulateEvent('pointermove', 106, 56);
      await hovered;
      simulateEvent('pointermove', 107, 57);
      simulateEvent('pointerdown', 107, 57);
      simulateEvent('pointerdrag', 127, 57);
      simulateEvent('pointerup', 127, 57);
      const coordinates = point.getGeometry().getCoordinates();
      assert.closeTo(coordinates[0], 120, 1e-6);
      assert.closeTo(coordinates[1], 50, 1e-6);
    });
  });
});
