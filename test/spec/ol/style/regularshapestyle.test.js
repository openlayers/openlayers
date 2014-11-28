goog.provide('ol.test.style.RegularShape');

describe('ol.style.RegularShape', function() {
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
});

goog.require('ol.style.RegularShape');
