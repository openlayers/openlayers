// See http://www.movable-type.co.uk/scripts/latlong.html
// FIXME add tests for crossTrackDistance
// FIXME add tests for maximumLatitude
// FIXME add tests for offset

goog.provide('ol.test.Sphere');


describe('ol.Sphere', function() {

  var sphere = new ol.Sphere(6371);
  var expected = [
    {
      c1: new ol.Coordinate(0, 0),
      c2: new ol.Coordinate(0, 0),
      cosineDistance: 0,
      equirectangularDistance: 0,
      finalBearing: 180,
      haversineDistance: 0,
      initialBearing: 0,
      midpoint: new ol.Coordinate(0, 0)
    },
    {
      c1: new ol.Coordinate(0, 0),
      c2: new ol.Coordinate(45, 45),
      cosineDistance: 6671.695598673524,
      equirectangularDistance: 6812.398372654371,
      finalBearing: 54.735610317245346,
      haversineDistance: 6671.695598673525,
      initialBearing: 35.264389682754654,
      midpoint: new ol.Coordinate(18.434948822922006, 24.0948425521107)
    },
    {
      c1: new ol.Coordinate(0, 0),
      c2: new ol.Coordinate(-45, 45),
      cosineDistance: 6671.695598673524,
      equirectangularDistance: 6812.398372654371,
      finalBearing: 305.26438968275465,
      haversineDistance: 6671.695598673525,
      initialBearing: -35.264389682754654,
      midpoint: new ol.Coordinate(-18.434948822922006, 24.0948425521107)
    },
    {
      c1: new ol.Coordinate(0, 0),
      c2: new ol.Coordinate(-45, -45),
      cosineDistance: 6671.695598673524,
      equirectangularDistance: 6812.398372654371,
      finalBearing: 234.73561031724535,
      haversineDistance: 6671.695598673525,
      initialBearing: -144.73561031724535,
      midpoint: new ol.Coordinate(-18.434948822922006, -24.0948425521107)
    },
    {
      c1: new ol.Coordinate(0, 0),
      c2: new ol.Coordinate(45, -45),
      cosineDistance: 6671.695598673524,
      equirectangularDistance: 6812.398372654371,
      finalBearing: 125.26438968275465,
      haversineDistance: 6671.695598673525,
      initialBearing: 144.73561031724535,
      midpoint: new ol.Coordinate(18.434948822922006, -24.0948425521107)
    },
    {
      c1: new ol.Coordinate(0, 0),
      c2: new ol.Coordinate(90, 180),
      cosineDistance: 10007.543398010286,
      equirectangularDistance: 20015.086796020572,
      finalBearing: 90,
      haversineDistance: 10007.543398010288,
      initialBearing: -90,
      midpoint: new ol.Coordinate(-45.00000000000005, 4.961398865471767e-15)
    },
    {
      c1: new ol.Coordinate(0, 0),
      c2: new ol.Coordinate(-90, 180),
      cosineDistance: 10007.543398010286,
      equirectangularDistance: 20015.086796020572,
      finalBearing: 270,
      haversineDistance: 10007.543398010288,
      initialBearing: 90,
      midpoint: new ol.Coordinate(45.00000000000005, 4.961398865471767e-15)
    },
    {
      c1: new ol.Coordinate(0, 0),
      c2: new ol.Coordinate(90, -180),
      cosineDistance: 10007.543398010286,
      equirectangularDistance: 20015.086796020572,
      finalBearing: 90,
      haversineDistance: 10007.543398010288,
      initialBearing: -90.00000000000001,
      midpoint: new ol.Coordinate(-45.00000000000005, -4.961398865471767e-15)
    },
    {
      c1: new ol.Coordinate(0, 0),
      c2: new ol.Coordinate(90, -180),
      cosineDistance: 10007.543398010286,
      equirectangularDistance: 20015.086796020572,
      finalBearing: 90,
      haversineDistance: 10007.543398010288,
      initialBearing: -90.00000000000001,
      midpoint: new ol.Coordinate(-45.00000000000005, -4.961398865471767e-15)
    },
    {
      c1: new ol.Coordinate(45, 45),
      c2: new ol.Coordinate(45, 45),
      cosineDistance: 0,
      equirectangularDistance: 0,
      finalBearing: 180,
      haversineDistance: 0,
      initialBearing: 0,
      midpoint: new ol.Coordinate(45.00000000000005, 45)
    },
    {
      c1: new ol.Coordinate(45, 45),
      c2: new ol.Coordinate(-45, 45),
      cosineDistance: 6671.695598673525,
      equirectangularDistance: 7076.401799751738,
      finalBearing: 234.73561031724535,
      haversineDistance: 6671.695598673525,
      initialBearing: -54.73561031724535,
      midpoint: new ol.Coordinate(0, 54.735610317245346)
    },
    {
      c1: new ol.Coordinate(45, 45),
      c2: new ol.Coordinate(-45, -45),
      cosineDistance: 13343.391197347048,
      equirectangularDistance: 14152.803599503475,
      finalBearing: 234.73561031724535,
      haversineDistance: 13343.391197347048,
      initialBearing: -125.26438968275465,
      midpoint: new ol.Coordinate(0, 0)
    },
    {
      c1: new ol.Coordinate(45, 45),
      c2: new ol.Coordinate(45, -45),
      cosineDistance: 10007.543398010284,
      equirectangularDistance: 10007.543398010286,
      finalBearing: 180,
      haversineDistance: 10007.543398010286,
      initialBearing: 180,
      midpoint: new ol.Coordinate(45.00000000000005, 0)
    },
    {
      c1: new ol.Coordinate(45, 45),
      c2: new ol.Coordinate(90, 180),
      cosineDistance: 13343.39119734705,
      equirectangularDistance: 15132.953174634127,
      finalBearing: 35.264389682754654,
      haversineDistance: 13343.391197347048,
      initialBearing: -54.735610317245346,
      midpoint: new ol.Coordinate(-45.00000000000005, 45.00000000000001)
    },
    {
      c1: new ol.Coordinate(45, 45),
      c2: new ol.Coordinate(-90, 180),
      cosineDistance: 6671.695598673524,
      equirectangularDistance: 16072.9523901477,
      finalBearing: 324.73561031724535,
      haversineDistance: 6671.695598673525,
      initialBearing: 125.26438968275465,
      midpoint: new ol.Coordinate(71.56505117707799, 24.094842552110702)
    },
    {
      c1: new ol.Coordinate(45, 45),
      c2: new ol.Coordinate(90, -180),
      cosineDistance: 13343.39119734705,
      equirectangularDistance: 25092.03003421417,
      finalBearing: 35.264389682754654,
      haversineDistance: 13343.391197347048,
      initialBearing: -54.735610317245346,
      midpoint: new ol.Coordinate(-45.00000000000005, 45)
    },
    {
      c1: new ol.Coordinate(45, 45),
      c2: new ol.Coordinate(90, -180),
      cosineDistance: 13343.39119734705,
      equirectangularDistance: 25092.03003421417,
      finalBearing: 35.264389682754654,
      haversineDistance: 13343.391197347048,
      initialBearing: -54.735610317245346,
      midpoint: new ol.Coordinate(-45.00000000000005, 45)
    },
    {
      c1: new ol.Coordinate(-45, 45),
      c2: new ol.Coordinate(-45, 45),
      cosineDistance: 0,
      equirectangularDistance: 0,
      finalBearing: 180,
      haversineDistance: 0,
      initialBearing: 0,
      midpoint: new ol.Coordinate(-45.00000000000005, 45)
    },
    {
      c1: new ol.Coordinate(-45, 45),
      c2: new ol.Coordinate(-45, -45),
      cosineDistance: 10007.543398010284,
      equirectangularDistance: 10007.543398010286,
      finalBearing: 180,
      haversineDistance: 10007.543398010286,
      initialBearing: 180,
      midpoint: new ol.Coordinate(-45.00000000000005, 0)
    },
    {
      c1: new ol.Coordinate(-45, 45),
      c2: new ol.Coordinate(45, -45),
      cosineDistance: 13343.391197347048,
      equirectangularDistance: 14152.803599503475,
      finalBearing: 125.26438968275465,
      haversineDistance: 13343.391197347048,
      initialBearing: 125.26438968275465,
      midpoint: new ol.Coordinate(0, 0)
    },
    {
      c1: new ol.Coordinate(-45, 45),
      c2: new ol.Coordinate(90, 180),
      cosineDistance: 6671.695598673524,
      equirectangularDistance: 16072.9523901477,
      finalBearing: 35.264389682754654,
      haversineDistance: 6671.695598673525,
      initialBearing: -125.26438968275465,
      midpoint: new ol.Coordinate(-71.56505117707799, 24.094842552110702)
    },
    {
      c1: new ol.Coordinate(-45, 45),
      c2: new ol.Coordinate(-90, 180),
      cosineDistance: 13343.39119734705,
      equirectangularDistance: 15132.953174634127,
      finalBearing: 324.73561031724535,
      haversineDistance: 13343.391197347048,
      initialBearing: 54.735610317245346,
      midpoint: new ol.Coordinate(45.00000000000005, 45.00000000000001)
    },
    {
      c1: new ol.Coordinate(-45, 45),
      c2: new ol.Coordinate(90, -180),
      cosineDistance: 6671.695598673525,
      equirectangularDistance: 25669.894779453065,
      finalBearing: 35.264389682754654,
      haversineDistance: 6671.695598673525,
      initialBearing: -125.26438968275465,
      midpoint: new ol.Coordinate(-71.56505117707799, 24.0948425521107)
    },
    {
      c1: new ol.Coordinate(-45, 45),
      c2: new ol.Coordinate(90, -180),
      cosineDistance: 6671.695598673525,
      equirectangularDistance: 25669.894779453065,
      finalBearing: 35.264389682754654,
      haversineDistance: 6671.695598673525,
      initialBearing: -125.26438968275465,
      midpoint: new ol.Coordinate(-71.56505117707799, 24.0948425521107)
    },
    {
      c1: new ol.Coordinate(-45, -45),
      c2: new ol.Coordinate(-45, -45),
      cosineDistance: 0,
      equirectangularDistance: 0,
      finalBearing: 180,
      haversineDistance: 0,
      initialBearing: 0,
      midpoint: new ol.Coordinate(-45.00000000000005, -45)
    },
    {
      c1: new ol.Coordinate(-45, -45),
      c2: new ol.Coordinate(45, -45),
      cosineDistance: 6671.695598673525,
      equirectangularDistance: 7076.401799751738,
      finalBearing: 54.735610317245346,
      haversineDistance: 6671.695598673525,
      initialBearing: 125.26438968275465,
      midpoint: new ol.Coordinate(0, -54.735610317245346)
    },
    {
      c1: new ol.Coordinate(-45, -45),
      c2: new ol.Coordinate(90, 180),
      cosineDistance: 6671.695598673525,
      equirectangularDistance: 25669.894779453065,
      finalBearing: 144.73561031724535,
      haversineDistance: 6671.695598673525,
      initialBearing: -54.735610317245346,
      midpoint: new ol.Coordinate(-71.56505117707799, -24.0948425521107)
    },
    {
      c1: new ol.Coordinate(-45, -45),
      c2: new ol.Coordinate(-90, 180),
      cosineDistance: 13343.39119734705,
      equirectangularDistance: 25092.03003421417,
      finalBearing: 215.26438968275465,
      haversineDistance: 13343.391197347048,
      initialBearing: 125.26438968275465,
      midpoint: new ol.Coordinate(45.00000000000005, -45)
    },
    {
      c1: new ol.Coordinate(-45, -45),
      c2: new ol.Coordinate(90, -180),
      cosineDistance: 6671.695598673524,
      equirectangularDistance: 16072.9523901477,
      finalBearing: 144.73561031724535,
      haversineDistance: 6671.695598673525,
      initialBearing: -54.73561031724536,
      midpoint: new ol.Coordinate(-71.56505117707799, -24.094842552110702)
    },
    {
      c1: new ol.Coordinate(-45, -45),
      c2: new ol.Coordinate(90, -180),
      cosineDistance: 6671.695598673524,
      equirectangularDistance: 16072.9523901477,
      finalBearing: 144.73561031724535,
      haversineDistance: 6671.695598673525,
      initialBearing: -54.73561031724536,
      midpoint: new ol.Coordinate(-71.56505117707799, -24.094842552110702)
    },
    {
      c1: new ol.Coordinate(45, -45),
      c2: new ol.Coordinate(45, -45),
      cosineDistance: 0,
      equirectangularDistance: 0,
      finalBearing: 180,
      haversineDistance: 0,
      initialBearing: 0,
      midpoint: new ol.Coordinate(45.00000000000005, -45)
    },
    {
      c1: new ol.Coordinate(45, -45),
      c2: new ol.Coordinate(90, 180),
      cosineDistance: 13343.39119734705,
      equirectangularDistance: 25092.03003421417,
      finalBearing: 144.73561031724535,
      haversineDistance: 13343.391197347048,
      initialBearing: -125.26438968275465,
      midpoint: new ol.Coordinate(-45.00000000000005, -45)
    },
    {
      c1: new ol.Coordinate(45, -45),
      c2: new ol.Coordinate(-90, 180),
      cosineDistance: 6671.695598673525,
      equirectangularDistance: 25669.894779453065,
      finalBearing: 215.26438968275465,
      haversineDistance: 6671.695598673525,
      initialBearing: 54.735610317245346,
      midpoint: new ol.Coordinate(71.56505117707799, -24.0948425521107)
    },
    {
      c1: new ol.Coordinate(45, -45),
      c2: new ol.Coordinate(90, -180),
      cosineDistance: 13343.39119734705,
      equirectangularDistance: 15132.953174634127,
      finalBearing: 144.73561031724535,
      haversineDistance: 13343.391197347048,
      initialBearing: -125.26438968275465,
      midpoint: new ol.Coordinate(-45.00000000000005, -45.00000000000001)
    },
    {
      c1: new ol.Coordinate(45, -45),
      c2: new ol.Coordinate(90, -180),
      cosineDistance: 13343.39119734705,
      equirectangularDistance: 15132.953174634127,
      finalBearing: 144.73561031724535,
      haversineDistance: 13343.391197347048,
      initialBearing: -125.26438968275465,
      midpoint: new ol.Coordinate(-45.00000000000005, -45.00000000000001)
    },
    {
      c1: new ol.Coordinate(90, 180),
      c2: new ol.Coordinate(90, 180),
      cosineDistance: 0,
      equirectangularDistance: 0,
      finalBearing: 180,
      haversineDistance: 0,
      initialBearing: 0,
      midpoint: new ol.Coordinate(-90, 7.0164775638926606e-15)
    },
    {
      c1: new ol.Coordinate(90, 180),
      c2: new ol.Coordinate(-90, 180),
      cosineDistance: 20015.086796020572,
      equirectangularDistance: 20015.086796020572,
      finalBearing: 26.565051177077976,
      haversineDistance: 20015.086796020572,
      initialBearing: 153.43494882292202,
      midpoint: new ol.Coordinate(-180, 63.43494882292201)
    },
    {
      c1: new ol.Coordinate(90, 180),
      c2: new ol.Coordinate(90, -180),
      cosineDistance: 0,
      equirectangularDistance: 40030.173592041145,
      finalBearing: 0,
      haversineDistance: 1.5603934160404731e-12,
      initialBearing: 0,
      midpoint: new ol.Coordinate(-90, 0)
    },
    {
      c1: new ol.Coordinate(90, 180),
      c2: new ol.Coordinate(90, -180),
      cosineDistance: 0,
      equirectangularDistance: 40030.173592041145,
      finalBearing: 0,
      haversineDistance: 1.5603934160404731e-12,
      initialBearing: 0,
      midpoint: new ol.Coordinate(-90, 0)
    },
    {
      c1: new ol.Coordinate(-90, 180),
      c2: new ol.Coordinate(-90, 180),
      cosineDistance: 0,
      equirectangularDistance: 0,
      finalBearing: 180,
      haversineDistance: 0,
      initialBearing: 0,
      midpoint: new ol.Coordinate(90, 7.0164775638926606e-15)
    },
    {
      c1: new ol.Coordinate(-90, 180),
      c2: new ol.Coordinate(90, -180),
      cosineDistance: 20015.086796020572,
      equirectangularDistance: 44755.09465146047,
      finalBearing: 270,
      haversineDistance: 20015.086796020572,
      initialBearing: -90,
      midpoint: new ol.Coordinate(-180, 0)
    },
    {
      c1: new ol.Coordinate(-90, 180),
      c2: new ol.Coordinate(90, -180),
      cosineDistance: 20015.086796020572,
      equirectangularDistance: 44755.09465146047,
      finalBearing: 270,
      haversineDistance: 20015.086796020572,
      initialBearing: -90,
      midpoint: new ol.Coordinate(-180, 0)
    },
    {
      c1: new ol.Coordinate(90, -180),
      c2: new ol.Coordinate(90, -180),
      cosineDistance: 0,
      equirectangularDistance: 0,
      finalBearing: 180,
      haversineDistance: 0,
      initialBearing: 0,
      midpoint: new ol.Coordinate(-90, -7.0164775638926606e-15)
    },
    {
      c1: new ol.Coordinate(90, -180),
      c2: new ol.Coordinate(90, -180),
      cosineDistance: 0,
      equirectangularDistance: 0,
      finalBearing: 180,
      haversineDistance: 0,
      initialBearing: 0,
      midpoint: new ol.Coordinate(-90, -7.0164775638926606e-15)
    },
    {
      c1: new ol.Coordinate(90, -180),
      c2: new ol.Coordinate(90, -180),
      cosineDistance: 0,
      equirectangularDistance: 0,
      finalBearing: 180,
      haversineDistance: 0,
      initialBearing: 0,
      midpoint: new ol.Coordinate(-90, -7.0164775638926606e-15)
    }
  ];

  describe('cosineDistance', function() {

    it('results match Chris Veness\'s reference implementation', function() {
      var e, i;
      for (i = 0; i < expected.length; ++i) {
        e = expected[i];
        expect(sphere.cosineDistance(e.c1, e.c2)).to.roughlyEqual(
            e.cosineDistance, 1e-9);
      }
    });

  });

  describe('equirectangularDistance', function() {

    it('results match Chris Veness\'s reference implementation', function() {
      var e, i;
      for (i = 0; i < expected.length; ++i) {
        e = expected[i];
        expect(sphere.equirectangularDistance(e.c1, e.c2)).to.roughlyEqual(
            e.equirectangularDistance, 1e-9);
      }
    });

  });

  describe('finalBearing', function() {

    it('results match Chris Veness\'s reference implementation', function() {
      var e, i;
      for (i = 0; i < expected.length; ++i) {
        e = expected[i];
        expect(sphere.finalBearing(e.c1, e.c2)).to.roughlyEqual(
            e.finalBearing, 1e-9);
      }
    });

  });

  describe('haversineDistance', function() {

    it('results match Chris Veness\'s reference implementation', function() {
      var e, i;
      for (i = 0; i < expected.length; ++i) {
        e = expected[i];
        expect(sphere.haversineDistance(e.c1, e.c2)).to.roughlyEqual(
            e.haversineDistance, 1e-9);
      }
    });

  });

  describe('initialBearing', function() {

    it('results match Chris Veness\'s reference implementation', function() {
      var e, i;
      for (i = 0; i < expected.length; ++i) {
        e = expected[i];
        expect(sphere.initialBearing(e.c1, e.c2)).to.roughlyEqual(
            e.initialBearing, 1e-9);
      }
    });

  });

  describe('midpoint', function() {

    it('results match Chris Veness\'s reference implementation', function() {
      var e, i, midpoint;
      for (i = 0; i < expected.length; ++i) {
        e = expected[i];
        midpoint = sphere.midpoint(e.c1, e.c2);
        // Test modulo 360 to avoid unnecessary expensive modulo operations
        // in our implementation.
        expect(goog.math.modulo(midpoint.x, 360)).to.roughlyEqual(
            goog.math.modulo(e.midpoint.x, 360), 1e-9);
        expect(midpoint.y).to.roughlyEqual(e.midpoint.y, 1e-9);
      }
    });

  });

});


goog.require('ol.Coordinate');
goog.require('ol.Sphere');
