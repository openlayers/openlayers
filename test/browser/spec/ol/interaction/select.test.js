import {assert} from 'chai';
import Collection from '../../../../../src/ol/Collection.js';
import Feature from '../../../../../src/ol/Feature.js';
import Map from '../../../../../src/ol/Map.js';
import MapBrowserEvent from '../../../../../src/ol/MapBrowserEvent.js';
import MapBrowserEventType from '../../../../../src/ol/MapBrowserEventType.js';
import View from '../../../../../src/ol/View.js';
import Polygon from '../../../../../src/ol/geom/Polygon.js';
import Interaction from '../../../../../src/ol/interaction/Interaction.js';
import Select from '../../../../../src/ol/interaction/Select.js';
import VectorLayer from '../../../../../src/ol/layer/Vector.js';
import VectorSource from '../../../../../src/ol/source/Vector.js';
import Style from '../../../../../src/ol/style/Style.js';

describe('ol.interaction.Select', function () {
  let target, map, layer, source;

  const width = 360;
  const height = 180;

  beforeEach(function () {
    target = document.createElement('div');

    const style = target.style;
    style.position = 'absolute';
    style.left = '-1000px';
    style.top = '-1000px';
    style.width = width + 'px';
    style.height = height + 'px';
    document.body.appendChild(target);

    const geometry = new Polygon([
      [
        [0, 0],
        [0, 40],
        [40, 40],
        [40, 0],
      ],
    ]);

    // Four overlapping features, two features of type "foo" and two features
    // of type "bar". The rendering order is, from top to bottom, foo -> bar
    // -> foo -> bar.
    const features = [];
    features.push(
      new Feature({
        geometry: geometry,
        type: 'bar',
      }),
      new Feature({
        geometry: geometry,
        type: 'foo',
      }),
      new Feature({
        geometry: geometry,
        type: 'bar',
      }),
      new Feature({
        geometry: geometry,
        type: 'foo',
      }),
    );

    source = new VectorSource({
      features: features,
    });

    layer = new VectorLayer({source: source});

    map = new Map({
      target: target,
      layers: [layer],
      view: new View({
        projection: 'EPSG:4326',
        center: [0, 0],
        resolution: 1,
      }),
    });

    map.renderSync();
  });

  afterEach(function () {
    disposeMap(map);
  });

  /**
   * Simulates a browser event on the map viewport.  The client x/y location
   * will be adjusted as if the map were centered at 0,0.
   * @param {string} type Event type.
   * @param {number} x Horizontal offset from map center.
   * @param {number} y Vertical offset from map center.
   * @param {boolean} [opt_shiftKey] Shift key is pressed.
   */
  function simulateEvent(type, x, y, opt_shiftKey) {
    const viewport = map.getViewport();
    // calculated in case body has top < 0 (test runner with small window)
    const position = viewport.getBoundingClientRect();
    const shiftKey = opt_shiftKey !== undefined ? opt_shiftKey : false;
    const event = {
      type: type,
      target: viewport.firstChild,
      clientX: position.left + x + width / 2,
      clientY: position.top + y + height / 2,
      shiftKey: shiftKey,
      stopPropagation: () => {
        event.propagationStopped = true;
      },
    };
    map.handleMapBrowserEvent(new MapBrowserEvent(type, map, event));
  }

  describe('constructor', function () {
    it('creates a new interaction', function () {
      const select = new Select();
      assert.instanceOf(select, Select);
      assert.instanceOf(select, Interaction);
    });

    describe('user-provided collection', function () {
      it('uses the user-provided collection', function () {
        const features = new Collection();
        const select = new Select({features: features});
        assert.strictEqual(select.getFeatures(), features);
      });
    });
  });

  describe('selecting a polygon', function () {
    let select;

    beforeEach(function () {
      select = new Select();
      map.addInteraction(select);
    });

    it('select with single-click', function () {
      const listenerSpy = vi.fn(function (e) {
        assert.lengthOf(e.selected, 1);
      });
      select.on('select', listenerSpy);

      simulateEvent('singleclick', 10, -20);

      assert.strictEqual(listenerSpy.mock.calls.length, 1);

      const features = select.getFeatures();
      assert.equal(features.getLength(), 1);
    });

    it('single-click outside the geometry', function () {
      const listenerSpy = vi.fn(function (e) {
        assert.lengthOf(e.selected, 1);
      });
      select.on('select', listenerSpy);

      simulateEvent(MapBrowserEventType.SINGLECLICK, -10, -10);

      assert.strictEqual(listenerSpy.mock.calls.length, 0);

      const features = select.getFeatures();
      assert.equal(features.getLength(), 0);
    });

    it('select twice with single-click', function () {
      const listenerSpy = vi.fn(function (e) {
        assert.lengthOf(e.selected, 1);
      });
      select.on('select', listenerSpy);

      simulateEvent(MapBrowserEventType.SINGLECLICK, 10, -20);
      simulateEvent(MapBrowserEventType.SINGLECLICK, 9, -21);

      assert.strictEqual(listenerSpy.mock.calls.length, 1);

      const features = select.getFeatures();
      assert.equal(features.getLength(), 1);
    });

    it('deselects before select', function () {
      const feature = source.getFeatures()[0];
      const geometry = feature.getGeometry().clone();
      geometry.translate(-40, 0);
      feature.setGeometry(geometry);
      map.renderSync();

      const features = select.getFeatures();
      const listenerSpy = vi.fn(function (e) {
        assert.isBelow(features.getLength(), 2);
      });
      features.on(['add', 'remove'], listenerSpy);

      simulateEvent(MapBrowserEventType.SINGLECLICK, 10, -20);
      simulateEvent(MapBrowserEventType.SINGLECLICK, -10, -21);

      assert.strictEqual(listenerSpy.mock.calls.length, 3);
      assert.strictEqual(listenerSpy.mock.calls[0][0].type, 'add');
      assert.strictEqual(listenerSpy.mock.calls[1][0].type, 'remove');
      assert.strictEqual(listenerSpy.mock.calls[2][0].type, 'add');

      assert.strictEqual(features.getLength(), 1);
    });

    it('select with shift single-click', function () {
      const listenerSpy = vi.fn(function (e) {
        assert.lengthOf(e.selected, 1);
      });
      select.on('select', listenerSpy);

      simulateEvent('singleclick', 10, -20, true);

      assert.strictEqual(listenerSpy.mock.calls.length, 1);

      const features = select.getFeatures();
      assert.equal(features.getLength(), 1);
    });
  });

  describe('multiselecting polygons', function () {
    let select;

    beforeEach(function () {
      select = new Select({
        multi: true,
      });
      map.addInteraction(select);
    });

    it('select with single-click', function () {
      const listenerSpy = vi.fn(function (e) {
        assert.lengthOf(e.selected, 4);
      });
      select.on('select', listenerSpy);

      simulateEvent('singleclick', 10, -20);

      assert.strictEqual(listenerSpy.mock.calls.length, 1);

      const features = select.getFeatures();
      assert.equal(features.getLength(), 4);
    });

    it('select with shift single-click', function () {
      const listenerSpy = vi.fn(function (e) {
        assert.lengthOf(e.selected, 4);
      });
      select.on('select', listenerSpy);

      simulateEvent('singleclick', 10, -20, true);

      assert.strictEqual(listenerSpy.mock.calls.length, 1);

      let features = select.getFeatures();
      assert.equal(features.getLength(), 4);
      assert.equal(select.getLayer(features.item(0)), layer);

      // Select again to make sure the style change does not break selection
      simulateEvent('singleclick', 10, -20);

      assert.strictEqual(listenerSpy.mock.calls.length, 1);

      features = select.getFeatures();
      assert.equal(features.getLength(), 4);
      assert.equal(select.getLayer(features.item(0)), layer);
    });
  });

  describe('toggle selecting polygons', function () {
    let select;

    beforeEach(function () {
      select = new Select({
        multi: true,
      });
      map.addInteraction(select);
    });

    it('with SHIFT + single-click', function () {
      const listenerSpy = vi.fn();
      select.on('select', listenerSpy);

      simulateEvent('singleclick', 10, -20, true);

      assert.strictEqual(listenerSpy.mock.calls.length, 1);

      let features = select.getFeatures();
      assert.equal(features.getLength(), 4);

      map.renderSync();

      simulateEvent('singleclick', 10, -20, true);

      assert.strictEqual(listenerSpy.mock.calls.length, 1);

      features = select.getFeatures();
      assert.equal(features.getLength(), 4);
    });
  });

  describe('filter features using the filter option', function () {
    describe('with multi set to true', function () {
      it('only selects features that pass the filter', function () {
        const select = new Select({
          multi: true,
          filter: function (feature, layer) {
            return feature.get('type') === 'bar';
          },
        });
        map.addInteraction(select);

        simulateEvent('singleclick', 10, -20);
        const features = select.getFeatures();
        assert.equal(features.getLength(), 2);
        assert.strictEqual(features.item(0).get('type'), 'bar');
        assert.strictEqual(features.item(1).get('type'), 'bar');
      });

      it(
        'only selects features that pass the filter ' +
          'using shift single-click',
        function () {
          const select = new Select({
            multi: true,
            filter: function (feature, layer) {
              return feature.get('type') === 'bar';
            },
          });
          map.addInteraction(select);

          simulateEvent('singleclick', 10, -20, true);
          const features = select.getFeatures();
          assert.equal(features.getLength(), 2);
          assert.strictEqual(features.item(0).get('type'), 'bar');
          assert.strictEqual(features.item(1).get('type'), 'bar');
        },
      );
    });

    describe('with multi set to false', function () {
      it('only selects the first feature that passes the filter', function () {
        const select = new Select({
          multi: false,
          filter: function (feature, layer) {
            return feature.get('type') === 'bar';
          },
        });
        map.addInteraction(select);
        simulateEvent('singleclick', 10, -20);
        const features = select.getFeatures();
        assert.equal(features.getLength(), 1);
        assert.strictEqual(features.item(0).get('type'), 'bar');
      });

      it(
        'only selects the first feature that passes the filter ' +
          'using shift single-click',
        function () {
          const select = new Select({
            multi: false,
            filter: function (feature, layer) {
              return feature.get('type') === 'bar';
            },
          });
          map.addInteraction(select);
          simulateEvent('singleclick', 10, -20, true);
          const features = select.getFeatures();
          assert.equal(features.getLength(), 1);
          assert.strictEqual(features.item(0).get('type'), 'bar');
        },
      );
    });
  });

  describe('#getLayer(feature)', function () {
    let interaction;

    beforeEach(function () {
      interaction = new Select();
      map.addInteraction(interaction);
    });
    afterEach(function () {
      map.removeInteraction(interaction);
    });

    it('returns a layer from a selected feature', function () {
      const listenerSpy = vi.fn(function (e) {
        const feature = e.selected[0];
        const layer_ = interaction.getLayer(feature);
        assert.lengthOf(e.selected, 1);
        assert.instanceOf(feature, Feature);
        assert.instanceOf(layer_, VectorLayer);
        assert.equal(layer_, layer);
      });
      interaction.on('select', listenerSpy);

      simulateEvent('singleclick', 10, -20);
      // Select again to make sure the style change does not break selection
      simulateEvent('singleclick', 10, -20);
    });

    it('returns a layer from a programmatically selected feature', function () {
      const feature = source.getFeatures()[0];
      interaction.getFeatures().push(feature);
      const layerWithSelectedFeature = interaction.getLayer(feature);
      assert.equal(layerWithSelectedFeature, layer);
    });

    it('removes layer association when removing feature programmatically from collection', function () {
      const features = interaction.getFeatures();
      const feature = source.getFeatures()[0];
      interaction.selectFeature(feature);
      assert.isNotEmpty(features.getArray());
      features.forEach((f) => assert.ok(interaction.getLayer(f)));

      features.clear();
      assert.isEmpty(features.getArray());
      assert.strictEqual(interaction.getLayer(feature), undefined);
    });

    it('returns the correct layer when two layers have features with the same id', function () {
      const featureA = new Feature();
      featureA.setId('shared-id');
      const sourceA = new VectorSource({features: [featureA]});
      const layerA = new VectorLayer({source: sourceA});

      const featureB = new Feature();
      featureB.setId('shared-id');
      const sourceB = new VectorSource({features: [featureB]});
      const layerB = new VectorLayer({source: sourceB});

      map.addLayer(layerA);
      map.addLayer(layerB);

      interaction.getFeatures().push(featureA);
      assert.equal(interaction.getLayer(featureA), layerA);

      interaction.getFeatures().clear();
      interaction.getFeatures().push(featureB);
      assert.equal(interaction.getLayer(featureB), layerB);

      map.removeLayer(layerA);
      map.removeLayer(layerB);
    });
  });

  describe('#setActive()', function () {
    let interaction;

    beforeEach(function () {
      interaction = new Select();

      assert.strictEqual(interaction.getActive(), true);

      map.addInteraction(interaction);

      simulateEvent('singleclick', 10, -20);
    });

    afterEach(function () {
      map.removeInteraction(interaction);
    });

    describe('#setActive(false)', function () {
      it('keeps the the selection', function () {
        interaction.setActive(false);
        assert.equal(interaction.getFeatures().getLength(), 1);
      });
    });

    describe('#setActive(true)', function () {
      beforeEach(function () {
        interaction.setActive(false);
      });
      it('fires change:active', function () {
        const listenerSpy = vi.fn();
        interaction.on('change:active', listenerSpy);
        interaction.setActive(true);
        assert.strictEqual(listenerSpy.mock.calls.length, 1);
      });
    });
  });

  describe('clear event listeners on interaction removal', function () {
    let firstInteraction, secondInteraction, feature;

    beforeEach(function () {
      feature = source.getFeatures()[3]; // top feature is selected

      const style = new Style({});
      const features = new Collection();

      firstInteraction = new Select({style, features});
      secondInteraction = new Select({style, features});
    });

    afterEach(function () {
      map.removeInteraction(secondInteraction);
      map.removeInteraction(firstInteraction);
    });

    // The base case
    describe('with a single interaction added', function () {
      it('changes the selected feature once', function () {
        map.addInteraction(firstInteraction);

        const listenerSpy = vi.fn();
        feature.on('change', listenerSpy);

        simulateEvent('singleclick', 10, -20, false);

        assert.strictEqual(listenerSpy.mock.calls.length, 1);
      });
    });

    // The "difficult" case. To prevent regression
    describe('with a replaced interaction', function () {
      it('changes the selected feature once', function () {
        map.addInteraction(firstInteraction);
        map.removeInteraction(firstInteraction);
        map.addInteraction(secondInteraction);

        const listenerSpy = vi.fn();
        feature.on('change', listenerSpy);

        simulateEvent('singleclick', 10, -20, false);

        assert.strictEqual(listenerSpy.mock.calls.length, 1);
      });
    });
  });

  describe('supports stop propagation', function () {
    let firstInteraction, secondInteraction;

    beforeEach(function () {
      firstInteraction = new Select();
      secondInteraction = new Select();

      map.addInteraction(firstInteraction);
      // note second interaction added to map last
      map.addInteraction(secondInteraction);
    });

    afterEach(function () {
      map.removeInteraction(firstInteraction);
      map.removeInteraction(secondInteraction);
    });

    //base case sanity check
    describe('without stop propagation', function () {
      it('both interactions dispatch select', function () {
        const firstSelectSpy = vi.fn();
        firstInteraction.on('select', firstSelectSpy);

        const secondSelectSpy = vi.fn();
        secondInteraction.on('select', secondSelectSpy);

        simulateEvent('singleclick', 10, -20);

        assert.strictEqual(firstSelectSpy.mock.calls.length, 1);
        assert.strictEqual(secondSelectSpy.mock.calls.length, 1);
      });
    });

    describe('calling stop propagation', function () {
      it('only "last" added interaction dispatches select', function () {
        const firstSelectSpy = vi.fn();
        firstInteraction.on('select', firstSelectSpy);

        const secondSelectSpy = vi.fn(function (e) {
          e.mapBrowserEvent.stopPropagation();
        });
        secondInteraction.on('select', secondSelectSpy);

        simulateEvent('singleclick', 10, -20);

        assert.strictEqual(firstSelectSpy.mock.calls.length, 0);
        assert.strictEqual(secondSelectSpy.mock.calls.length, 1);
      });
    });
  });
  describe('programmatically modifying selection', function () {
    describe('without a filter', function () {
      let select, feature, selected;

      beforeEach(function () {
        select = new Select();
        map.addInteraction(select);
        feature = source.getFeatures()[0];
        selected = select.getFeatures().getArray();
      });
      afterEach(function () {
        map.removeInteraction(select);
      });
      describe('using #selectFeature(feature)', function () {
        it('adds to selection', function () {
          select.selectFeature(feature);
          assert.include(selected, feature);
        });
        it('adds to layer associations', function () {
          select.selectFeature(feature);
          assert.equal(select.getLayer(feature), layer);
        });
        it('sends select event with selected feature', function () {
          const listenerSpy = vi.fn();
          select.on('select', listenerSpy);

          select.selectFeature(feature);

          assert.strictEqual(listenerSpy.mock.calls.length, 1);
          assert.lengthOf(listenerSpy.mock.calls[0][0].selected, 1);
          assert.include(listenerSpy.mock.calls[0][0].selected, feature);
          assert.lengthOf(listenerSpy.mock.calls[0][0].deselected, 0);
        });
        it("doesn't select duplicates", function () {
          select.selectFeature(feature);
          select.selectFeature(feature);

          assert.lengthOf(selected, 1);
        });
      });
      describe('using #deselectFeature(feature)', function () {
        beforeEach(function () {
          select.selectFeature(feature);
        });
        it('removes from selection', function () {
          select.deselectFeature(feature);
          assert.notInclude(selected, feature);
        });
        it('sends select event with deselected feature', function () {
          const listenerSpy = vi.fn();
          select.on('select', listenerSpy);

          select.deselectFeature(feature);

          assert.strictEqual(listenerSpy.mock.calls.length, 1);
          assert.lengthOf(listenerSpy.mock.calls[0][0].deselected, 1);
          assert.include(listenerSpy.mock.calls[0][0].deselected, feature);
          assert.lengthOf(listenerSpy.mock.calls[0][0].selected, 0);
        });
        it("doesn't error on repeated calls with the same feature", function () {
          const result1 = select.deselectFeature(feature);
          const result2 = select.deselectFeature(feature);
          assert.strictEqual(result1, true);
          assert.strictEqual(result2, false);

          assert.isEmpty(selected);
        });
      });

      describe('using #toggleFeature(feature)', function () {
        let otherFeature;
        beforeEach(function () {
          select.selectFeature(feature);
          otherFeature = source.getFeatures()[1];
        });
        it('selects a missing feature', function () {
          select.toggleFeature(otherFeature);
          assert.include(selected, otherFeature);
        });
        it('sends select event with selected feature', function () {
          const listenerSpy = vi.fn();
          select.on('select', listenerSpy);

          select.toggleFeature(otherFeature);

          assert.strictEqual(listenerSpy.mock.calls.length, 1);
          assert.lengthOf(listenerSpy.mock.calls[0][0].selected, 1);
          assert.include(listenerSpy.mock.calls[0][0].selected, otherFeature);
          assert.lengthOf(listenerSpy.mock.calls[0][0].deselected, 0);
        });
        it('deselects an existing feature', function () {
          select.toggleFeature(feature);
          assert.notInclude(selected, feature);
        });
        it('sends select event with deselected feature', function () {
          const listenerSpy = vi.fn();
          select.on('select', listenerSpy);

          select.toggleFeature(feature);

          assert.strictEqual(listenerSpy.mock.calls.length, 1);
          assert.lengthOf(listenerSpy.mock.calls[0][0].deselected, 1);
          assert.include(listenerSpy.mock.calls[0][0].deselected, feature);
          assert.lengthOf(listenerSpy.mock.calls[0][0].selected, 0);
        });
        it('can be called many times to toggle a feature', function () {
          const listenerSpy = vi.fn();
          select.on('select', listenerSpy);

          select.toggleFeature(feature); // remove
          select.toggleFeature(feature); // add
          select.toggleFeature(feature); // remove
          select.toggleFeature(feature); // add

          assert.strictEqual(listenerSpy.mock.calls.length, 4);
        });
      });
      describe('using #clearSelection()', function () {
        let allFeatures;
        beforeEach(function () {
          allFeatures = source.getFeatures();
          allFeatures.forEach((f) => select.selectFeature(f));
        });
        it('clears all features', function () {
          select.clearSelection();

          assert.lengthOf(selected, 0);
        });
        it('sends a select event with all features deselected', function () {
          const listenerSpy = vi.fn();
          select.on('select', listenerSpy);
          select.clearSelection();
          assert.strictEqual(listenerSpy.mock.calls.length, 1);
          const deselected = listenerSpy.mock.calls[0][0].deselected;
          assert.lengthOf(deselected, allFeatures.length);
        });
      });
    });
    describe('with a filter', function () {
      let select, allFeatures, selected;

      beforeEach(function () {
        select = new Select({
          filter: function (feature, layer) {
            return feature.get('type') === 'bar';
          },
        });
        map.addInteraction(select);
        allFeatures = source.getFeatures();
        selected = select.getFeatures().getArray();
      });
      afterEach(function () {
        map.removeInteraction(select);
      });
      describe('using #selectFeature(feature)', function () {
        it('only selects matching features', function () {
          allFeatures.forEach((f) => select.selectFeature(f));

          assert.lengthOf(selected, 2);
          assert.strictEqual(selected[0].get('type'), 'bar');
          assert.strictEqual(selected[1].get('type'), 'bar');
        });
        it('does not fire select event for feature already selected', function () {
          const spy = vi.fn();
          select.on('select', spy);
          const result1 = select.selectFeature(allFeatures[0]);
          assert.strictEqual(result1, true);
          assert.strictEqual(spy.mock.calls.length, 1);

          const result2 = select.selectFeature(allFeatures[0]);
          assert.strictEqual(result2, false);
          assert.strictEqual(spy.mock.calls.length, 1);
        });
      });
      describe('using #toggleFeature(feature)', function () {
        it('only selects matching features', function () {
          allFeatures.forEach((f) => select.toggleFeature(f));

          assert.lengthOf(selected, 2);
          assert.strictEqual(selected[0].get('type'), 'bar');
          assert.strictEqual(selected[1].get('type'), 'bar');
        });
      });
    });
  });
});
