goog.provide('ol.test.style.Style');

describe('ol.style.Style', function() {

  describe('#setMutable', function() {

    it('recursively sets the mutable flag', function() {
      var style = new ol.style.Style({
        fill: new ol.style.Fill({
          color: 'rgba(255, 255, 255, 0.6)'
        }),
        stroke: new ol.style.Stroke({
          color: '#319FD3',
          width: 1
        }),
        text: new ol.style.Text({
          font: '12px Calibri,sans-serif',
          fill: new ol.style.Fill({
            color: '#000'
          }),
          stroke: new ol.style.Stroke({
            color: '#fff',
            width: 3
          })
        })
      });

      expect(function() {
        style.setZIndex(1);
      }).to.not.throwException();

      expect(style.mutable_).to.be(true);
      expect(style.getFill().mutable_).to.be(true);
      expect(style.getStroke().mutable_).to.be(true);
      expect(style.getText().mutable_).to.be(true);
      expect(style.getText().getStroke().mutable_).to.be(true);

      style.setMutable(false);

      expect(function() {
        style.setZIndex();
      }).to.throwException();

      expect(style.mutable_).to.be(false);
      expect(style.getFill().mutable_).to.be(false);
      expect(style.getStroke().mutable_).to.be(false);
      expect(style.getText().mutable_).to.be(false);
      expect(style.getText().getStroke().mutable_).to.be(false);
    });
  });
});

describe('ol.style.createStyleFunction()', function() {
  var style = new ol.style.Style();

  it('creates a style function from a single style', function() {
    var styleFunction = ol.style.createStyleFunction(style);
    expect(styleFunction()).to.eql([style]);
  });

  it('creates a style function from an array of styles', function() {
    var styleFunction = ol.style.createStyleFunction([style]);
    expect(styleFunction()).to.eql([style]);
  });

  it('passes through a function', function() {
    var original = function() {
      return [style];
    };
    var styleFunction = ol.style.createStyleFunction(original);
    expect(styleFunction).to.be(original);
  });

  it('throws on (some) unexpected input', function() {
    expect(function() {
      ol.style.createStyleFunction({bogus: 'input'});
    }).to.throwException();
  });

  it('makes styles immutable', function() {
    var style = new ol.style.Style({
      fill: new ol.style.Fill({
        color: 'rgba(255, 255, 255, 0.6)'
      }),
      stroke: new ol.style.Stroke({
        color: '#319FD3',
        width: 1
      }),
      text: new ol.style.Text({
        font: '12px Calibri,sans-serif',
        fill: new ol.style.Fill({
          color: '#000'
        }),
        stroke: new ol.style.Stroke({
          color: '#fff',
          width: 3
        })
      })
    });

    expect(function() {
      style.getFill().setColor('white');
    }).to.not.throwException();

    ol.style.createStyleFunction(style);

    expect(function() {
      style.getFill().setColor('black');
    }).to.throwException();

  });
});

goog.require('ol.style.Fill');
goog.require('ol.style.Stroke');
goog.require('ol.style.Style');
goog.require('ol.style.Text');
