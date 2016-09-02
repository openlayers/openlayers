goog.provide('ol.test.style.RegularShape');

goog.require('ol.style.AtlasManager');
goog.require('ol.style.RegularShape');
goog.require('ol.style.Fill');
goog.require('ol.style.Stroke');


describe('ol.style.RegularShape', function() {

  describe('#constructor', function() {

    it('can use rotateWithView', function() {
      var style = new ol.style.RegularShape({
        rotateWithView: true,
        radius: 0
      });
      expect(style.getRotateWithView()).to.be(true);
    });

    it('can use radius', function() {
      var style = new ol.style.RegularShape({
        radius: 5,
        radius2: 10
      });
      expect(style.getRadius()).to.eql(5);
      expect(style.getRadius2()).to.eql(10);
    });

    it('can use radius1 as an alias for radius', function() {
      var style = new ol.style.RegularShape({
        radius1: 5,
        radius2: 10
      });
      expect(style.getRadius()).to.eql(5);
      expect(style.getRadius2()).to.eql(10);
    });

    it('will use radius for radius2 if radius2 not defined', function() {
      var style = new ol.style.RegularShape({
        radius: 5
      });
      expect(style.getRadius()).to.eql(5);
      expect(style.getRadius2()).to.eql(5);
    });

    it('will use radius1 for radius2 if radius2 not defined', function() {
      var style = new ol.style.RegularShape({
        radius1: 5
      });
      expect(style.getRadius()).to.eql(5);
      expect(style.getRadius2()).to.eql(5);
    });

    it('creates a canvas if no atlas is used (no fill-style)', function() {
      var style = new ol.style.RegularShape({radius: 10});
      expect(style.getImage()).to.be.an(HTMLCanvasElement);
      expect(style.getSize()).to.eql([21, 21]);
      expect(style.getImageSize()).to.eql([21, 21]);
      expect(style.getOrigin()).to.eql([0, 0]);
      expect(style.getAnchor()).to.eql([10.5, 10.5]);
      // hit-detection image is created, because no fill style is set
      expect(style.getImage()).to.not.be(style.getHitDetectionImage());
      expect(style.getHitDetectionImage()).to.be.an(HTMLCanvasElement);
      expect(style.getHitDetectionImageSize()).to.eql([21, 21]);
    });

    it('creates a canvas if no atlas is used (fill-style)', function() {
      var style = new ol.style.RegularShape({
        radius: 10,
        fill: new ol.style.Fill({
          color: '#FFFF00'
        })
      });
      expect(style.getImage()).to.be.an(HTMLCanvasElement);
      expect(style.getSize()).to.eql([21, 21]);
      expect(style.getImageSize()).to.eql([21, 21]);
      expect(style.getOrigin()).to.eql([0, 0]);
      expect(style.getAnchor()).to.eql([10.5, 10.5]);
      // no hit-detection image is created, because fill style is set
      expect(style.getImage()).to.be(style.getHitDetectionImage());
      expect(style.getHitDetectionImage()).to.be.an(HTMLCanvasElement);
      expect(style.getHitDetectionImageSize()).to.eql([21, 21]);
    });

    it('adds itself to an atlas manager (no fill-style)', function() {
      var atlasManager = new ol.style.AtlasManager({initialSize: 512});
      var style = new ol.style.RegularShape(
          {radius: 10, atlasManager: atlasManager});
      expect(style.getImage()).to.be.an(HTMLCanvasElement);
      expect(style.getSize()).to.eql([21, 21]);
      expect(style.getImageSize()).to.eql([512, 512]);
      expect(style.getOrigin()).to.eql([1, 1]);
      expect(style.getAnchor()).to.eql([10.5, 10.5]);
      // hit-detection image is created, because no fill style is set
      expect(style.getImage()).to.not.be(style.getHitDetectionImage());
      expect(style.getHitDetectionImage()).to.be.an(HTMLCanvasElement);
      expect(style.getHitDetectionImageSize()).to.eql([512, 512]);
    });

    it('adds itself to an atlas manager (fill-style)', function() {
      var atlasManager = new ol.style.AtlasManager({initialSize: 512});
      var style = new ol.style.RegularShape({
        radius: 10,
        atlasManager: atlasManager,
        fill: new ol.style.Fill({
          color: '#FFFF00'
        })
      });
      expect(style.getImage()).to.be.an(HTMLCanvasElement);
      expect(style.getSize()).to.eql([21, 21]);
      expect(style.getImageSize()).to.eql([512, 512]);
      expect(style.getOrigin()).to.eql([1, 1]);
      expect(style.getAnchor()).to.eql([10.5, 10.5]);
      // no hit-detection image is created, because fill style is set
      expect(style.getImage()).to.be(style.getHitDetectionImage());
      expect(style.getHitDetectionImage()).to.be.an(HTMLCanvasElement);
      expect(style.getHitDetectionImageSize()).to.eql([512, 512]);
    });
  });


  describe('#getChecksum', function() {

    it('calculates not the same hash code (radius)', function() {
      var style1 = new ol.style.RegularShape({
        radius: 4,
        radius2: 5
      });
      var style2 = new ol.style.RegularShape({
        radius: 3,
        radius2: 5
      });
      expect(style1.getChecksum()).to.not.eql(style2.getChecksum());
    });

    it('calculates not the same hash code (radius2)', function() {
      var style1 = new ol.style.RegularShape({
        radius: 4,
        radius2: 5
      });
      var style2 = new ol.style.RegularShape({
        radius: 4,
        radius2: 6
      });
      expect(style1.getChecksum()).to.not.eql(style2.getChecksum());
    });

    it('calculates the same hash code (radius)', function() {
      var style1 = new ol.style.RegularShape({
        radius: 5
      });
      var style2 = new ol.style.RegularShape({
        radius: 5
      });
      expect(style1.getChecksum()).to.eql(style2.getChecksum());
    });

    it('calculates not the same hash code (color)', function() {
      var style1 = new ol.style.RegularShape({
        radius: 5,
        fill: new ol.style.Fill({
          color: '#319FD3'
        })
      });
      var style2 = new ol.style.RegularShape({
        radius: 5,
        stroke: new ol.style.Stroke({
          color: '#319FD3'
        })
      });
      expect(style1.getChecksum()).to.not.eql(style2.getChecksum());
    });

    it('calculates the same hash code (everything set)', function() {
      var style1 = new ol.style.RegularShape({
        radius: 5,
        radius2: 3,
        angle: 1.41,
        points: 5,
        fill: new ol.style.Fill({
          color: '#319FD3'
        }),
        stroke: new ol.style.Stroke({
          color: '#319FD3',
          lineCap: 'round',
          lineDash: [5, 15, 25],
          lineJoin: 'miter',
          miterLimit: 4,
          width: 2
        })
      });
      var style2 = new ol.style.RegularShape({
        radius: 5,
        radius2: 3,
        angle: 1.41,
        points: 5,
        fill: new ol.style.Fill({
          color: '#319FD3'
        }),
        stroke: new ol.style.Stroke({
          color: '#319FD3',
          lineCap: 'round',
          lineDash: [5, 15, 25],
          lineJoin: 'miter',
          miterLimit: 4,
          width: 2
        })
      });
      expect(style1.getChecksum()).to.eql(style2.getChecksum());
    });

    it('calculates not the same hash code (stroke width differs)', function() {
      var style1 = new ol.style.RegularShape({
        radius: 5,
        radius2: 3,
        angle: 1.41,
        points: 5,
        fill: new ol.style.Fill({
          color: '#319FD3'
        }),
        stroke: new ol.style.Stroke({
          color: '#319FD3',
          lineCap: 'round',
          lineDash: [5, 15, 25],
          lineJoin: 'miter',
          miterLimit: 4,
          width: 3
        })
      });
      var style2 = new ol.style.RegularShape({
        radius: 5,
        radius2: 3,
        angle: 1.41,
        points: 5,
        fill: new ol.style.Fill({
          color: '#319FD3'
        }),
        stroke: new ol.style.Stroke({
          color: '#319FD3',
          lineCap: 'round',
          lineDash: [5, 15, 25],
          lineJoin: 'miter',
          miterLimit: 4,
          width: 2
        })
      });
      expect(style1.getChecksum()).to.not.eql(style2.getChecksum());
    });

    it('invalidates a cached checksum if values change (fill)', function() {
      var style1 = new ol.style.RegularShape({
        radius: 5,
        fill: new ol.style.Fill({
          color: '#319FD3'
        }),
        stroke: new ol.style.Stroke({
          color: '#319FD3'
        })
      });
      var style2 = new ol.style.RegularShape({
        radius: 5,
        fill: new ol.style.Fill({
          color: '#319FD3'
        }),
        stroke: new ol.style.Stroke({
          color: '#319FD3'
        })
      });
      expect(style1.getChecksum()).to.eql(style2.getChecksum());

      style1.getFill().setColor('red');
      expect(style1.getChecksum()).to.not.eql(style2.getChecksum());
    });

    it('invalidates a cached checksum if values change (stroke)', function() {
      var style1 = new ol.style.RegularShape({
        radius: 5,
        fill: new ol.style.Fill({
          color: '#319FD3'
        }),
        stroke: new ol.style.Stroke({
          color: '#319FD3'
        })
      });
      var style2 = new ol.style.RegularShape({
        radius: 5,
        fill: new ol.style.Fill({
          color: '#319FD3'
        }),
        stroke: new ol.style.Stroke({
          color: '#319FD3'
        })
      });
      expect(style1.getChecksum()).to.eql(style2.getChecksum());

      style1.getStroke().setWidth(4);
      expect(style1.getChecksum()).to.not.eql(style2.getChecksum());
    });

  });
});
