import Layer from '../../../../../src/ol/layer/Tile.js';
import Link from '../../../../../src/ol/interaction/Link.js';
import Map from '../../../../../src/ol/Map.js';
import View from '../../../../../src/ol/View.js';

describe('ol/interaction/Link', () => {
  let map;

  beforeEach(function () {
    map = new Map({
      target: createMapDiv(100, 100),
      view: new View({
        center: [0, 0],
        resolutions: [4, 2, 1],
        zoom: 1,
      }),
      layers: [
        new Layer({visible: true}),
        new Layer({visible: false}),
        new Layer({visible: true}),
      ],
    });
    map.renderSync();
  });

  afterEach(function () {
    disposeMap(map);
  });

  describe('constructor', () => {
    it('addds view state to the url', (done) => {
      map.addInteraction(new Link());

      map.once('moveend', () => {
        const url = new URL(window.location.href);
        const params = url.searchParams;
        expect(params.get('z')).to.be('2');
        expect(params.get('x')).to.be('3');
        expect(params.get('y')).to.be('4');
        expect(params.get('r')).to.be('0.5');
        expect(params.get('l')).to.be('101');
        done();
      });

      const view = map.getView();
      view.setZoom(2);
      view.setCenter([3, 4]);
      view.setRotation(0.5);
    });

    it('accepts a prefix', (done) => {
      map.addInteraction(new Link({prefix: 'ol:'}));

      map.once('moveend', () => {
        const url = new URL(window.location.href);
        const params = url.searchParams;
        expect(params.get('ol:z')).to.be('2');
        expect(params.get('ol:x')).to.be('3');
        expect(params.get('ol:y')).to.be('4');
        expect(params.get('ol:r')).to.be('0.5');
        expect(params.get('ol:l')).to.be('101');
        done();
      });

      const view = map.getView();
      view.setZoom(2);
      view.setCenter([3, 4]);
      view.setRotation(0.5);
    });

    it('accepts an array of properties to track', (done) => {
      map.addInteraction(new Link({params: ['z', 'r']}));

      map.once('moveend', () => {
        const url = new URL(window.location.href);
        const params = url.searchParams;
        expect(params.get('z')).to.be('2');
        expect(params.get('x')).to.be(null);
        expect(params.get('y')).to.be(null);
        expect(params.get('r')).to.be('0.5');
        expect(params.get('l')).to.be(null);
        done();
      });

      const view = map.getView();
      view.setZoom(2);
      view.setCenter([3, 4]);
      view.setRotation(0.5);
    });
  });
});
