goog.provide('ol.test.proj.CH');
goog.provide('ol.test.proj.EPSG2056');
goog.provide('ol.test.proj.EPSG21781');


describe('ol.proj.CH', function() {

  beforeEach(function() {
    ol.proj.CH.add();
  });

  it('has the correct constants', function() {
    expect(ol.proj.CH.ELLIPSOID.eSquared).to.roughlyEqual(
        0.006674372230614, 1e-13);
    expect(ol.proj.CH.R).to.roughlyEqual(6378815.90365, 1e-5);
    expect(ol.proj.CH.ALPHA).to.roughlyEqual(1.00072913843038, 1e-14);
    expect(ol.proj.CH.B0).to.roughlyEqual(
        goog.math.toRadians((3600 * 46 + 60 * 54 + 27.83324844) / 3600),
        1e-13);
    expect(ol.proj.CH.K).to.roughlyEqual(0.0030667323772751, 1e-13);
  });

  it('can transform from EPSG:2056 to EPSG:21781', function() {
    var output = ol.proj.transform(
        [2660389.515487, 1185731.630396], 'EPSG:2056', 'EPSG:21781');
    expect(output).to.be.an(Array);
    expect(output).to.have.length(2);
    expect(output[0]).to.roughlyEqual(660389.515487, 1e-9);
    expect(output[1]).to.roughlyEqual(185731.630396, 1e-9);
  });

  it('can transform from EPSG:21781 to EPSG:2056', function() {
    var output = ol.proj.transform(
        [660389.515487, 185731.630396], 'EPSG:21781', 'EPSG:2056');
    expect(output).to.be.an(Array);
    expect(output).to.have.length(2);
    expect(output[0]).to.roughlyEqual(2660389.515487, 1e-10);
    expect(output[1]).to.roughlyEqual(1185731.630396, 1e-10);
  });

});


describe('ol.proj.EPSG2056', function() {

  var epsg2056;
  beforeEach(function() {
    ol.proj.EPSG2056.add();
    epsg2056 = ol.proj.get('EPSG:2056');
    expect(epsg2056).to.be.an(ol.proj.Projection);
  });

  it('transforms from EPSG:2056 to EPSG:4326', function() {
    var wgs84 = ol.proj.transform(
        [2679520.05, 1212273.44], 'EPSG:2056', 'EPSG:4326');
    expect(wgs84).to.be.an(Array);
    expect(wgs84).to.have.length(2);
    expect(wgs84[0]).to.roughlyEqual(
        (3600 * 8 + 60 * 29 + 11.111272) / 3600, 1e-8);
    expect(wgs84[1]).to.roughlyEqual(
        (3600 * 47 + 60 * 3 + 28.956592) / 3600, 1e-8);
  });

  it('transforms from EPSG:4326 to EPSG:2056', function() {
    var lv95 = ol.proj.transform([
      (3600 * 8 + 60 * 29 + 11.11127154) / 3600,
      (3600 * 47 + 60 * 3 + 28.95659233) / 3600
    ], 'EPSG:4326', 'EPSG:2056');
    expect(lv95).to.be.an(Array);
    expect(lv95).to.have.length(2);
    expect(lv95[0]).to.roughlyEqual(2679520.05, 1e-3);
    expect(lv95[1]).to.roughlyEqual(1212273.44, 1e-3);
  });

});



describe('ol.proj.EPSG21781', function() {

  var epsg21781;
  beforeEach(function() {
    ol.proj.EPSG21781.add();
    epsg21781 = ol.proj.get('EPSG:21781');
    expect(epsg21781).to.be.an(ol.proj.Projection);
  });

  it('maintains accuracy when round-tripping', function() {
    var extent = epsg21781.getExtent();
    var fromEPSG4326 = ol.proj.getTransform('EPSG:4326', 'EPSG:21781');
    var toEPSG4326 = ol.proj.getTransform('EPSG:21781', 'EPSG:4326');
    var roundTripped, x, y;
    for (x = extent[0]; x < extent[2]; x += 50000) {
      for (y = extent[1]; y < extent[3]; y += 50000) {
        roundTripped = fromEPSG4326(toEPSG4326([x, y]));
        expect(roundTripped).to.be.an(Array);
        expect(roundTripped).to.have.length(2);
        expect(roundTripped[0]).to.roughlyEqual(x, 1e-3);
        expect(roundTripped[1]).to.roughlyEqual(y, 1e-3);
      }
    }
  });

  it('transforms from EPSG:21781 to EPSG:4326', function() {
    var wgs84 = ol.proj.transform(
        [679520.05, 212273.44], 'EPSG:21781', 'EPSG:4326');
    expect(wgs84).to.be.an(Array);
    expect(wgs84).to.have.length(2);
    expect(wgs84[0]).to.roughlyEqual(
        (3600 * 8 + 60 * 29 + 11.111272) / 3600, 1e-8);
    expect(wgs84[1]).to.roughlyEqual(
        (3600 * 47 + 60 * 3 + 28.956592) / 3600, 1e-8);
  });

  it('transforms from EPSG:4326 to EPSG:21781', function() {
    var lv03 = ol.proj.transform([
      (3600 * 8 + 60 * 29 + 11.11127154) / 3600,
      (3600 * 47 + 60 * 3 + 28.95659233) / 3600
    ], 'EPSG:4326', 'EPSG:21781');
    expect(lv03).to.be.an(Array);
    expect(lv03).to.have.length(2);
    expect(lv03[0]).to.roughlyEqual(679520.05, 1e-3);
    expect(lv03[1]).to.roughlyEqual(212273.44, 1e-3);
  });

});


goog.require('goog.math');
goog.require('ol.proj');
goog.require('ol.proj.CH');
goog.require('ol.proj.EPSG2056');
goog.require('ol.proj.EPSG21781');
goog.require('ol.proj.Projection');
