goog.require('goog.testing.jsunit');
goog.require('ol.Object');
goog.require('ol3');


function testObject1() {
  var obj = {k: 1};
  obj = ol3.object(obj);
  assertTrue(obj instanceof ol.Object);
  assertEquals(1, obj.get('k'));
}


function testObject2() {
  var obj1 = new ol.Object();
  var obj2 = ol3.object(obj1);
  assertTrue(obj2 === obj1);
}

