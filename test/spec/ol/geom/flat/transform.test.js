goog.provide('ol.test.geom.flat.transform');

goog.require('ol.geom.MultiPolygon');
goog.require('ol.geom.SimpleGeometry');
goog.require('ol.geom.flat.transform');


describe('ol.geom.flat.transform', function() {

  describe('ol.geom.flat.transform.transform2D', function() {

    it('transforms a Simple Geometry to 2D', function() {

      var multiPolygonGeometry = new ol.geom.MultiPolygon([
        [[[-80.736061, 28.788576000000006, 0],
          [-80.763557, 28.821799999999996, 0],
          [-80.817406, 28.895123999999996, 0],
          [-80.891304, 29.013130000000004, 0],
          [-80.916512, 29.071560000000005, 0],
          [-80.899323, 29.061249000000004, 0],
          [-80.862663, 28.991361999999995, 0],
          [-80.736061, 28.788576000000006, 0]]], [[
          [-82.102127, 26.585724, 0],
          [-82.067139, 26.497208, 0],
          [-82.097641, 26.493585999999993, 0],
          [-82.135895, 26.642279000000002, 0],
          [-82.183495, 26.683082999999996, 0],
          [-82.128838, 26.693342, 0],
          [-82.102127, 26.585724, 0]]]
      ]).transform('EPSG:4326', 'EPSG:3857');
      var transform = [
        0.0004088332670837288, 0,
        0, -0.0004088332670837288,
        4480.991370439071, 1529.5752568707105
      ];
      var pixelCoordinates = ol.geom.SimpleGeometry.transform2D(
          multiPolygonGeometry, transform, []);
      expect(pixelCoordinates[0]).to.roughlyEqual(806.6035275946265, 1e-9);
      expect(pixelCoordinates[1]).to.roughlyEqual(160.48916296287916, 1e-9);
      expect(pixelCoordinates[2]).to.roughlyEqual(805.3521540835154, 1e-9);
      expect(pixelCoordinates[3]).to.roughlyEqual(158.76358389011807, 1e-9);
      expect(pixelCoordinates[4]).to.roughlyEqual(802.9014262612932, 1e-9);
      expect(pixelCoordinates[5]).to.roughlyEqual(154.95335187132082, 1e-9);
      expect(pixelCoordinates[6]).to.roughlyEqual(799.5382461724039, 1e-9);
      expect(pixelCoordinates[7]).to.roughlyEqual(148.815592819916, 1e-9);
      expect(pixelCoordinates[8]).to.roughlyEqual(798.3910020835165, 1e-9);
      expect(pixelCoordinates[9]).to.roughlyEqual(145.77392230456553, 1e-9);
      expect(pixelCoordinates[10]).to.roughlyEqual(799.1732925724045, 1e-9);
      expect(pixelCoordinates[11]).to.roughlyEqual(146.31080369865776, 1e-9);
      expect(pixelCoordinates[12]).to.roughlyEqual(800.8417299057378, 1e-9);
      expect(pixelCoordinates[13]).to.roughlyEqual(149.94832216046188, 1e-9);
      expect(pixelCoordinates[14]).to.roughlyEqual(806.6035275946265, 1e-9);
      expect(pixelCoordinates[15]).to.roughlyEqual(160.48916296287916, 1e-9);
      expect(pixelCoordinates[16]).to.roughlyEqual(744.4323460835158, 1e-9);
      expect(pixelCoordinates[17]).to.roughlyEqual(273.7179168205373, 1e-9);
      expect(pixelCoordinates[18]).to.roughlyEqual(746.0246888390716, 1e-9);
      expect(pixelCoordinates[19]).to.roughlyEqual(278.22094795365365, 1e-9);
      expect(pixelCoordinates[20]).to.roughlyEqual(744.6365089279602, 1e-9);
      expect(pixelCoordinates[21]).to.roughlyEqual(278.40513424671826, 1e-9);
      expect(pixelCoordinates[22]).to.roughlyEqual(742.8955268835157, 1e-9);
      expect(pixelCoordinates[23]).to.roughlyEqual(270.83899948444764, 1e-9);
      expect(pixelCoordinates[24]).to.roughlyEqual(740.7291979946272, 1e-9);
      expect(pixelCoordinates[25]).to.roughlyEqual(268.76099731369345, 1e-9);
      expect(pixelCoordinates[26]).to.roughlyEqual(743.2166987946266, 1e-9);
      expect(pixelCoordinates[27]).to.roughlyEqual(268.23842607400616, 1e-9);
      expect(pixelCoordinates[28]).to.roughlyEqual(744.4323460835158, 1e-9);
      expect(pixelCoordinates[29]).to.roughlyEqual(273.7179168205373, 1e-9);
    });

  });

  describe('ol.geom.flat.transform.translate', function() {
    it('translates the coordinates array', function() {
      var multiPolygon = new ol.geom.MultiPolygon([
        [[[0, 0, 2], [0, 1, 2], [1, 1, 2], [1, 0, 2], [0, 0, 2]]],
        [[[2, 2, 3], [2, 3, 3], [3, 3, 3], [3, 2, 3], [2, 2, 3]]]]);
      var flatCoordinates = multiPolygon.getFlatCoordinates();
      var deltaX = 1;
      var deltaY = 2;
      ol.geom.flat.transform.translate(flatCoordinates, 0,
          flatCoordinates.length, multiPolygon.getStride(),
          deltaX, deltaY, flatCoordinates);
      expect(flatCoordinates).to.eql([
        1, 2, 2, 1, 3, 2, 2, 3, 2, 2, 2, 2, 1, 2, 2,
        3, 4, 3, 3, 5, 3, 4, 5, 3, 4, 4, 3, 3, 4, 3]);
    });
  });

  describe('ol.geom.flat.transform.rotate', function() {
    it('rotates the coordinates array', function() {
      var multiPolygon = new ol.geom.MultiPolygon([
        [[[0, 0, 2], [0, 1, 2], [1, 1, 2], [1, 0, 2], [0, 0, 2]]],
        [[[2, 2, 3], [2, 3, 3], [3, 3, 3], [3, 2, 3], [2, 2, 3]]]]);
      var flatCoordinates = multiPolygon.getFlatCoordinates();
      var angle = Math.PI / 2;
      var anchor = [0, 1];
      ol.geom.flat.transform.rotate(flatCoordinates, 0,
          flatCoordinates.length, multiPolygon.getStride(),
          angle, anchor, flatCoordinates);
      expect(flatCoordinates[0]).to.roughlyEqual(1, 1e-9);
      expect(flatCoordinates[1]).to.roughlyEqual(1, 1e-9);
      expect(flatCoordinates[2]).to.roughlyEqual(2, 1e-9);
      expect(flatCoordinates[3]).to.roughlyEqual(0, 1e-9);
      expect(flatCoordinates[4]).to.roughlyEqual(1, 1e-9);
      expect(flatCoordinates[5]).to.roughlyEqual(2, 1e-9);
      expect(flatCoordinates[6]).to.roughlyEqual(Math.cos(angle), 1e-9);
      expect(flatCoordinates[7]).to.roughlyEqual(2, 1e-9);
      expect(flatCoordinates[8]).to.roughlyEqual(2, 1e-9);
      expect(flatCoordinates[9]).to.roughlyEqual(1, 1e-9);
      expect(flatCoordinates[10]).to.roughlyEqual(2, 1e-9);
      expect(flatCoordinates[11]).to.roughlyEqual(2, 1e-9);
      expect(flatCoordinates[12]).to.roughlyEqual(1, 1e-9);
      expect(flatCoordinates[13]).to.roughlyEqual(1, 1e-9);
      expect(flatCoordinates[14]).to.roughlyEqual(2, 1e-9);
      expect(flatCoordinates[15]).to.roughlyEqual(-1, 1e-9);
      expect(flatCoordinates[16]).to.roughlyEqual(3, 1e-9);
      expect(flatCoordinates[17]).to.roughlyEqual(3, 1e-9);
      expect(flatCoordinates[18]).to.roughlyEqual(-2, 1e-9);
      expect(flatCoordinates[19]).to.roughlyEqual(3, 1e-9);
      expect(flatCoordinates[20]).to.roughlyEqual(3, 1e-9);
      expect(flatCoordinates[21]).to.roughlyEqual(-2, 1e-9);
      expect(flatCoordinates[22]).to.roughlyEqual(4, 1e-9);
      expect(flatCoordinates[23]).to.roughlyEqual(3, 1e-9);
      expect(flatCoordinates[24]).to.roughlyEqual(-1, 1e-9);
      expect(flatCoordinates[25]).to.roughlyEqual(4, 1e-9);
      expect(flatCoordinates[26]).to.roughlyEqual(3, 1e-9);
      expect(flatCoordinates[27]).to.roughlyEqual(-1, 1e-9);
      expect(flatCoordinates[28]).to.roughlyEqual(3, 1e-9);
      expect(flatCoordinates[29]).to.roughlyEqual(3, 1e-9);
    });

  });

});
