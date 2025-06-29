import {spy as sinonSpy} from 'sinon';
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

  beforeEach(function (done) {
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

    map.once('postrender', function () {
      done();
    });
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
      expect(select).to.be.a(Select);
      expect(select).to.be.a(Interaction);
    });

    describe('user-provided collection', function () {
      it('uses the user-provided collection', function () {
        const features = new Collection();
        const select = new Select({features: features});
        expect(select.getFeatures()).to.be(features);
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
      const listenerSpy = sinonSpy(function (e) {
        expect(e.selected).to.have.length(1);
      });
      select.on('select', listenerSpy);

      simulateEvent('singleclick', 10, -20);

      expect(listenerSpy.callCount).to.be(1);

      const features = select.getFeatures();
      expect(features.getLength()).to.equal(1);
    });

    it('single-click outside the geometry', function () {
      const listenerSpy = sinonSpy(function (e) {
        expect(e.selected).to.have.length(1);
      });
      select.on('select', listenerSpy);

      simulateEvent(MapBrowserEventType.SINGLECLICK, -10, -10);

      expect(listenerSpy.callCount).to.be(0);

      const features = select.getFeatures();
      expect(features.getLength()).to.equal(0);
    });

    it('select twice with single-click', function () {
      const listenerSpy = sinonSpy(function (e) {
        expect(e.selected).to.have.length(1);
      });
      select.on('select', listenerSpy);

      simulateEvent(MapBrowserEventType.SINGLECLICK, 10, -20);
      simulateEvent(MapBrowserEventType.SINGLECLICK, 9, -21);

      expect(listenerSpy.callCount).to.be(1);

      const features = select.getFeatures();
      expect(features.getLength()).to.equal(1);
    });

    it('select with shift single-click', function () {
      const listenerSpy = sinonSpy(function (e) {
        expect(e.selected).to.have.length(1);
      });
      select.on('select', listenerSpy);

      simulateEvent('singleclick', 10, -20, true);

      expect(listenerSpy.callCount).to.be(1);

      const features = select.getFeatures();
      expect(features.getLength()).to.equal(1);
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
      const listenerSpy = sinonSpy(function (e) {
        expect(e.selected).to.have.length(4);
      });
      select.on('select', listenerSpy);

      simulateEvent('singleclick', 10, -20);

      expect(listenerSpy.callCount).to.be(1);

      const features = select.getFeatures();
      expect(features.getLength()).to.equal(4);
    });

    it('select with shift single-click', function () {
      const listenerSpy = sinonSpy(function (e) {
        expect(e.selected).to.have.length(4);
      });
      select.on('select', listenerSpy);

      simulateEvent('singleclick', 10, -20, true);

      expect(listenerSpy.callCount).to.be(1);

      let features = select.getFeatures();
      expect(features.getLength()).to.equal(4);
      expect(select.getLayer(features.item(0))).to.equal(layer);

      // Select again to make sure the style change does not break selection
      simulateEvent('singleclick', 10, -20);

      expect(listenerSpy.callCount).to.be(1);

      features = select.getFeatures();
      expect(features.getLength()).to.equal(4);
      expect(select.getLayer(features.item(0))).to.equal(layer);
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
      const listenerSpy = sinonSpy();
      select.on('select', listenerSpy);

      simulateEvent('singleclick', 10, -20, true);

      expect(listenerSpy.callCount).to.be(1);

      let features = select.getFeatures();
      expect(features.getLength()).to.equal(4);

      map.renderSync();

      simulateEvent('singleclick', 10, -20, true);

      expect(listenerSpy.callCount).to.be(1);

      features = select.getFeatures();
      expect(features.getLength()).to.equal(4);
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
        expect(features.getLength()).to.equal(2);
        expect(features.item(0).get('type')).to.be('bar');
        expect(features.item(1).get('type')).to.be('bar');
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
          expect(features.getLength()).to.equal(2);
          expect(features.item(0).get('type')).to.be('bar');
          expect(features.item(1).get('type')).to.be('bar');
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
        expect(features.getLength()).to.equal(1);
        expect(features.item(0).get('type')).to.be('bar');
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
          expect(features.getLength()).to.equal(1);
          expect(features.item(0).get('type')).to.be('bar');
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
      const listenerSpy = sinonSpy(function (e) {
        const feature = e.selected[0];
        const layer_ = interaction.getLayer(feature);
        expect(e.selected).to.have.length(1);
        expect(feature).to.be.a(Feature);
        expect(layer_).to.be.a(VectorLayer);
        expect(layer_).to.equal(layer);
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
      expect(layerWithSelectedFeature).to.equal(layer);
    });
  });

  describe('#setActive()', function () {
    let interaction;

    beforeEach(function () {
      interaction = new Select();

      expect(interaction.getActive()).to.be(true);

      map.addInteraction(interaction);

      simulateEvent('singleclick', 10, -20);
    });

    afterEach(function () {
      map.removeInteraction(interaction);
    });

    describe('#setActive(false)', function () {
      it('keeps the the selection', function () {
        interaction.setActive(false);
        expect(interaction.getFeatures().getLength()).to.equal(1);
      });
    });

    describe('#setActive(true)', function () {
      beforeEach(function () {
        interaction.setActive(false);
      });
      it('fires change:active', function () {
        const listenerSpy = sinonSpy();
        interaction.on('change:active', listenerSpy);
        interaction.setActive(true);
        expect(listenerSpy.callCount).to.be(1);
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

        const listenerSpy = sinonSpy();
        feature.on('change', listenerSpy);

        simulateEvent('singleclick', 10, -20, false);

        expect(listenerSpy.callCount).to.be(1);
      });
    });

    // The "difficult" case. To prevent regression
    describe('with a replaced interaction', function () {
      it('changes the selected feature once', function () {
        map.addInteraction(firstInteraction);
        map.removeInteraction(firstInteraction);
        map.addInteraction(secondInteraction);

        const listenerSpy = sinonSpy();
        feature.on('change', listenerSpy);

        simulateEvent('singleclick', 10, -20, false);

        expect(listenerSpy.callCount).to.be(1);
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
        const firstSelectSpy = sinonSpy();
        firstInteraction.on('select', firstSelectSpy);

        const secondSelectSpy = sinonSpy();
        secondInteraction.on('select', secondSelectSpy);

        simulateEvent('singleclick', 10, -20);

        expect(firstSelectSpy.callCount).to.be(1);
        expect(secondSelectSpy.callCount).to.be(1);
      });
    });

    describe('calling stop propagation', function () {
      it('only "last" added interaction dispatches select', function () {
        const firstSelectSpy = sinonSpy();
        firstInteraction.on('select', firstSelectSpy);

        const secondSelectSpy = sinonSpy(function (e) {
          e.mapBrowserEvent.stopPropagation();
        });
        secondInteraction.on('select', secondSelectSpy);

        simulateEvent('singleclick', 10, -20);

        expect(firstSelectSpy.callCount).to.be(0);
        expect(secondSelectSpy.callCount).to.be(1);
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
          expect(selected).to.contain(feature);
        });
        it('adds to layer associations', function () {
          select.selectFeature(feature);
          expect(select.getLayer(feature)).to.equal(layer);
        });
        it('sends select event with selected feature', function () {
          const listenerSpy = sinonSpy();
          select.on('select', listenerSpy);

          select.selectFeature(feature);

          expect(listenerSpy.callCount).to.be(1);
          expect(listenerSpy.args[0][0].selected).to.have.length(1);
          expect(listenerSpy.args[0][0].selected).to.contain(feature);
          expect(listenerSpy.args[0][0].deselected).to.have.length(0);
        });
        it("doesn't select duplicates", function () {
          select.selectFeature(feature);
          select.selectFeature(feature);

          expect(selected).to.have.length(1);
        });
      });
      describe('using #deselectFeature(feature)', function () {
        beforeEach(function () {
          select.selectFeature(feature);
        });
        it('removes from selection', function () {
          select.deselectFeature(feature);
          expect(selected).to.not.contain(feature);
        });
        it('sends select event with deselected feature', function () {
          const listenerSpy = sinonSpy();
          select.on('select', listenerSpy);

          select.deselectFeature(feature);

          expect(listenerSpy.callCount).to.be(1);
          expect(listenerSpy.args[0][0].deselected).to.have.length(1);
          expect(listenerSpy.args[0][0].deselected).to.contain(feature);
          expect(listenerSpy.args[0][0].selected).to.have.length(0);
        });
        it("doesn't error on repeated calls with the same feature", function () {
          select.deselectFeature(feature);
          select.deselectFeature(feature);

          expect(selected).to.have.length(0);
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
          expect(selected).to.contain(otherFeature);
        });
        it('sends select event with selected feature', function () {
          const listenerSpy = sinonSpy();
          select.on('select', listenerSpy);

          select.toggleFeature(otherFeature);

          expect(listenerSpy.callCount).to.be(1);
          expect(listenerSpy.args[0][0].selected).to.have.length(1);
          expect(listenerSpy.args[0][0].selected).to.contain(otherFeature);
          expect(listenerSpy.args[0][0].deselected).to.have.length(0);
        });
        it('deselects an existing feature', function () {
          select.toggleFeature(feature);
          expect(selected).to.not.contain(feature);
        });
        it('sends select event with deselected feature', function () {
          const listenerSpy = sinonSpy();
          select.on('select', listenerSpy);

          select.toggleFeature(feature);

          expect(listenerSpy.callCount).to.be(1);
          expect(listenerSpy.args[0][0].deselected).to.have.length(1);
          expect(listenerSpy.args[0][0].deselected).to.contain(feature);
          expect(listenerSpy.args[0][0].selected).to.have.length(0);
        });
        it('can be called many times to toggle a feature', function () {
          const listenerSpy = sinonSpy();
          select.on('select', listenerSpy);

          select.toggleFeature(feature); // remove
          select.toggleFeature(feature); // add
          select.toggleFeature(feature); // remove
          select.toggleFeature(feature); // add

          expect(listenerSpy.callCount).to.be(4);
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

          expect(selected).to.have.length(0);
        });
        it('sends a select event with all features deselected', function () {
          const listenerSpy = sinonSpy();
          select.on('select', listenerSpy);
          select.clearSelection();
          expect(listenerSpy.callCount).to.be(1);
          const deselected = listenerSpy.args[0][0].deselected;
          expect(deselected).to.have.length(allFeatures.length);
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

          expect(selected).to.have.length(2);
          expect(selected[0].get('type')).to.be('bar');
          expect(selected[1].get('type')).to.be('bar');
        });
      });
      describe('using #toggleFeature(feature)', function () {
        it('only selects matching features', function () {
          allFeatures.forEach((f) => select.toggleFeature(f));

          expect(selected).to.have.length(2);
          expect(selected[0].get('type')).to.be('bar');
          expect(selected[1].get('type')).to.be('bar');
        });
      });
    });
  });
});
