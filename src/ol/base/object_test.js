goog.require('goog.testing.jsunit');
goog.require('ol.Object');


function testModel() {
  var m = new ol.Object();
  assertNotNullNorUndefined(m);
}


function testGetUndefined() {
  var m = new ol.Object();
  assertUndefined(m.get('k'));
}


function testGetSetGet() {
  var m = new ol.Object();
  assertUndefined(m.get('k'));
  m.set('k', 1);
  assertEquals(1, m.get('k'));
}


function testSetValues() {
  var m = new ol.Object();
  m.setValues({
    k1: 1,
    k2: 2
  });
  assertEquals(1, m.get('k1'));
  assertEquals(2, m.get('k2'));
}


function testNotifyKeyEvent() {
  var m = new ol.Object();
  var eventDispatched = false;
  goog.events.listen(m, 'k_changed', function() {
    eventDispatched = true;
  });
  m.notify('k');
  assertTrue(eventDispatched);
}


function testBindSetNotifyKeyEvent() {
  var m = new ol.Object();
  var n = new ol.Object();
  var callbackCalled = false;
  goog.events.listen(n, 'k_changed', function() {
    eventDispatched = true;
  });
  n.bindTo('k', m);
  m.set('k', 1);
  assertTrue(eventDispatched);
}


function testSetNotifyKeyEvent() {
  var m = new ol.Object();
  var eventDispatched = false;
  goog.events.listen(m, 'k_changed', function() {
    eventDispatched = true;
  });
  m.set('k', 1);
  assertTrue(eventDispatched);
}


function testSetBind() {
  var m = new ol.Object();
  var n = new ol.Object();
  m.set('k', 1);
  assertEquals(1, m.get('k'));
  assertUndefined(n.get('k'));
  n.bindTo('k', m);
  assertEquals(1, m.get('k'));
  assertEquals(1, n.get('k'));
}


function testBindSet() {
  var m = new ol.Object();
  var n = new ol.Object();
  n.bindTo('k', m);
  m.set('k', 1);
  assertEquals(1, m.get('k'));
  assertEquals(1, n.get('k'));
}


function testBindSetBackwards() {
  var m = new ol.Object();
  var n = new ol.Object();
  n.bindTo('k', m);
  n.set('k', 1);
  assertEquals(1, m.get('k'));
  assertEquals(1, n.get('k'));
}


function testSetBindBackwards() {
  var m = new ol.Object();
  var n = new ol.Object();
  n.set('k', 1);
  n.bindTo('k', m);
  assertUndefined(m.get('k'));
  assertUndefined(n.get('k'));
}


function testBindSetUnbind() {
  var m = new ol.Object();
  var n = new ol.Object();
  n.bindTo('k', m);
  n.set('k', 1);
  assertEquals(1, m.get('k'));
  assertEquals(1, n.get('k'));
  n.unbind('k');
  assertEquals(1, m.get('k'));
  assertEquals(1, n.get('k'));
  n.set('k', 2);
  assertEquals(1, m.get('k'));
  assertEquals(2, n.get('k'));
}


function testUnbindAll() {
  var m = new ol.Object();
  var n = new ol.Object();
  n.bindTo('k', m);
  n.set('k', 1);
  assertEquals(m.get('k'), 1);
  assertEquals(n.get('k'), 1);
  n.unbindAll();
  assertEquals(m.get('k'), 1);
  assertEquals(n.get('k'), 1);
  n.set('k', 2);
  assertEquals(m.get('k'), 1);
  assertEquals(n.get('k'), 2);
}


function testBindNotify() {
  var m = new ol.Object();
  var n = new ol.Object();
  m.bindTo('k', n);
  mEventDispatched = false;
  goog.events.listen(m, 'k_changed', function() {
    mEventDispatched = true;
  });
  nEventDispatched = false;
  goog.events.listen(n, 'k_changed', function() {
    nEventDispatched = true;
  });
  n.set('k', 1);
  assertTrue(mEventDispatched);
  assertTrue(nEventDispatched);
}


function testBindBackwardsNotify() {
  var m = new ol.Object();
  var n = new ol.Object();
  n.bindTo('k', m);
  mEventDispatched = false;
  goog.events.listen(m, 'k_changed', function() {
    mEventDispatched = true;
  });
  nEventDispatched = false;
  goog.events.listen(n, 'k_changed', function() {
    nEventDispatched = true;
  });
  n.set('k', 1);
  assertTrue(mEventDispatched);
  assertTrue(nEventDispatched);
}


function testBindRename() {
  var m = new ol.Object();
  var n = new ol.Object();
  n.bindTo('kn', m, 'km');
  m.set('km', 1);
  assertEquals(m.get('km'), 1);
  assertEquals(n.get('kn'), 1);
}


function testBindRenameEvents() {
  var m = new ol.Object();
  var n = new ol.Object();
  kmEventDispatched = false;
  goog.events.listen(m, 'km_changed', function() {
    kmEventDispatched = true;
  });
  knEventDispatched = false;
  goog.events.listen(n, 'kn_changed', function() {
    knEventDispatched = true;
  });
  n.bindTo('kn', m, 'km');
  m.set('km', 1);
  assertEquals(m.get('km'), 1);
  assertEquals(n.get('kn'), 1);
  assertTrue(kmEventDispatched);
  assertTrue(knEventDispatched);
}


function testTransitiveBindForwards() {
  var m = new ol.Object();
  var n = new ol.Object();
  var o = new ol.Object();
  n.bindTo('kn', m, 'km');
  o.bindTo('ko', n, 'kn');
  m.set('km', 1);
  assertEquals(1, m.get('km'));
  assertEquals(1, n.get('kn'));
  assertEquals(1, o.get('ko'));
}


function testTransitiveBindBackwards() {
  var m = new ol.Object();
  var n = new ol.Object();
  var o = new ol.Object();
  n.bindTo('kn', m, 'km');
  o.bindTo('ko', n, 'kn');
  o.set('ko', 1);
  assertEquals(1, m.get('km'));
  assertEquals(1, n.get('kn'));
  assertEquals(1, o.get('ko'));
}


function testMrideyAccessors() {
  // http://blog.mridey.com/2010/03/maps-javascript-api-v3-more-about.html
  var a = new ol.Object();
  a.set('level', 2);
  assertEquals(2, a.get('level'));
  var b = new ol.Object();
  b.setValues({
    level: 2,
    index: 3,
    description: 'Hello world.'
  });
  assertEquals(3, b.get('index'));
}


function testMrideyBinding() {
  // http://blog.mridey.com/2010/03/maps-javascript-api-v3-more-about.html
  var a = new ol.Object();
  a.set('level', 2);
  var b = new ol.Object();
  b.bindTo('index', a, 'level');
  assertEquals(2, b.get('index'));
  a.set('level', 3);
  assertEquals(3, b.get('index'));
  b.set('index', 4);
  assertEquals(4, a.get('level'));
  var c = new ol.Object();
  c.bindTo('zoom', a, 'level');
  assertEquals(4, c.get('zoom'));
  b.unbind('index');
  assertEquals(4, b.get('index'));
  c.set('zoom', 5);
  assertEquals(5, a.get('level'));
  assertEquals(4, b.get('index'));
}


function testCircularBind() {
  var a = new ol.Object();
  var b = new ol.Object();
  a.bindTo('k', b);
  assertThrows(function() {
    b.bindTo('k', a);
  });
}


function testPriority() {
  var a = new ol.Object();
  var b = new ol.Object();
  a.set('k', 1);
  b.set('k', 2);
  a.bindTo('k', b);
  assertEquals(2, a.get('k'));
  assertEquals(2, b.get('k'));
}


function testPriorityUndefined() {
  var a = new ol.Object();
  var b = new ol.Object();
  a.set('k', 1);
  a.bindTo('k', b);
  assertUndefined(a.get('k'));
  assertUndefined(b.get('k'));
}


function testSetter() {
  var a = new ol.Object();
  var x;
  var setterCalled;
  a.setX = function(value) {
    this.x = value;
    setterCalled = true;
  };
  a.set('x', 1);
  assertEquals(1, a.get('x'));
  assertUndefined(setterCalled);
}


function testSetterBind() {
  var a = new ol.Object();
  var x;
  var setterCalled;
  a.setX = function(value) {
    this.x = value;
    setterCalled = true;
  };
  var b = new ol.Object();
  b.bindTo('x', a);
  b.set('x', 1);
  assertEquals(1, a.get('x'));
  assertEquals(1, b.get('x'));
  assertTrue(setterCalled);
}


function testGetter() {
  var a = new ol.Object();
  var getterCalled;
  a.getX = function() {
    getterCalled = true;
    return 1;
  };
  assertUndefined(a.get('x'));
  assertUndefined(getterCalled);
}


function testGetterBind() {
  var a = new ol.Object();
  var getterCalled;
  a.getX = function() {
    getterCalled = true;
    return 1;
  };
  var b = new ol.Object();
  b.bindTo('x', a);
  assertEquals(1, b.get('x'));
  assertTrue(getterCalled);
}


function testBindSelf() {
  var a = new ol.Object();
  assertThrows(function() {
    a.bindTo('k', a);
  });
}


function testCreateFromObject() {
  var obj = {k: 1};
  obj = ol.Object.create(obj);
  assertTrue(obj instanceof ol.Object);
  assertEquals(1, obj.get('k'));
}


function testCreateFromObject() {
  var obj1 = new ol.Object();
  var obj2 = ol.Object.create(obj1);
  assertTrue(obj2 === obj1);
}


function testCreateWithOptions() {
  var obj = new ol.Object({k: 1});
  assertEquals(1, obj.get('k'));
}


function testEventTypeCaseSensitivity() {
  var obj = new ol.Object();
  var lowercaseEventDispatched = false;
  goog.events.listen(obj, 'k_changed', function() {
    lowercaseEventDispatched = true;
  });
  var uppercaseEventDispatched = false;
  goog.events.listen(obj, 'K_changed', function() {
    uppercaseEventDispatched = true;
  });
  obj.set('K', 1);
  assertTrue(lowercaseEventDispatched);
  assertFalse(uppercaseEventDispatched);
}
