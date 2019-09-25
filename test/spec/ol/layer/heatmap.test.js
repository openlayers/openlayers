import HeatmapLayer from '../../../../src/ol/layer/Heatmap.js';


describe('ol.layer.Heatmap', () => {

  describe('constructor', () => {

    test('can be constructed without arguments', () => {
      const instance = new HeatmapLayer();
      expect(instance).toBeInstanceOf(HeatmapLayer);
    });

  });

});
