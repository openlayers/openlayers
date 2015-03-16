// Copyright 2012 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

goog.provide('goog.dbTest');
goog.setTestOnly('goog.dbTest');

goog.require('goog.Disposable');
goog.require('goog.array');
goog.require('goog.async.Deferred');
goog.require('goog.async.DeferredList');
goog.require('goog.db');
goog.require('goog.db.Cursor');
goog.require('goog.db.Error');
goog.require('goog.db.IndexedDb');
goog.require('goog.db.KeyRange');
goog.require('goog.db.Transaction');
goog.require('goog.events');
goog.require('goog.object');
goog.require('goog.testing.AsyncTestCase');
goog.require('goog.testing.PropertyReplacer');
goog.require('goog.testing.asserts');
goog.require('goog.testing.jsunit');
goog.require('goog.userAgent.product');
goog.require('goog.userAgent.product.isVersion');

var idbSupported = goog.userAgent.product.CHROME &&
    goog.userAgent.product.isVersion('22');
var asyncTestCase = goog.testing.AsyncTestCase.createAndInstall();
asyncTestCase.stepTimeout = 5000;
var dbName;
var dbBaseName = 'testDb';
var globalDb = null;
var propertyReplacer;

// On Chrome 24+, the database reports its default version as 1 as opposed to
// the empty string (as per the new spec).
var baseVersion = goog.userAgent.product.isVersion('24') ? 1 : '';

var dbVersion = 1;

function unblockDatabase(db) {
  // If a test goes wrong, the database connection may not be closed reliably.
  // This listens for a version change event (e.g. from deleting it in
  // preparation for the next test) and closes the existing connection when one
  // is received.
  goog.events.listen(
      db, goog.db.IndexedDb.EventType.VERSION_CHANGE,
      function(ev) { db.close(); });
}

function openDatabase() {
  return goog.db.openDatabase(dbName).addCallback(unblockDatabase);
}

function incrementVersion(db, onUpgradeNeeded) {
  if (db.isOpen()) {
    db.close();
  }

  var onBlocked = function(ev) {
    fail('Upgrade to version ' + dbVersion + ' is blocked.');
  };

  return goog.db.openDatabase(dbName, ++dbVersion, onUpgradeNeeded, onBlocked).
      addCallback(unblockDatabase).addCallback(function(db) {
        assertEquals(dbVersion, db.getVersion());
      });
}

function addStore(db) {
  return incrementVersion(db, function(ev, db, tx) {
    db.createObjectStore('store');
  });
}

function addStoreWithIndex(db) {
  return incrementVersion(db, function(ev, db, tx) {
    var store = db.createObjectStore('store', {keyPath: 'key'});
    store.createIndex('index', 'value');
  });
}

function populateStore(values, keys, db) {
  var putTx = db.createTransaction(
      ['store'],
      goog.db.Transaction.TransactionMode.READ_WRITE);

  var store = putTx.objectStore('store');
  for (var i = 0; i < values.length; ++i) {
    store.put(values[i], keys[i]);
  }
  return putTx.wait();
}

function populateStoreWithObjects(values, keys, db) {
  var putTx = db.createTransaction(
      ['store'],
      goog.db.Transaction.TransactionMode.READ_WRITE);
  var store = putTx.objectStore('store');
  goog.array.forEach(values, function(value, index) {
    store.put({'key': keys[index], 'value': value});
  });
  return putTx.wait();
}

function assertStoreValues(values, db) {
  var assertStoreTx = db.createTransaction(['store']);
  assertStoreTx.objectStore('store').getAll().addCallback(function(results) {
    assertSameElements(values, results);
    closeAndContinue(db);
  });
}

function assertStoreObjectValues(values, db) {
  var assertStoreTx = db.createTransaction(['store']);
  assertStoreTx.objectStore('store').getAll().addCallback(function(results) {
    var retrievedValues = goog.array.map(results, function(result) {
      return result['value'];
    });
    assertSameElements(values, retrievedValues);
    closeAndContinue(db);
  });
}

function assertStoreValuesAndCursorsDisposed(values, cursors, db) {
  var assertStoreTx = db.createTransaction(['store']);
  assertStoreTx.objectStore('store').getAll().addCallback(function(results) {
    assertSameElements(values, results);
    assertTrue(cursors.length > 0);
    goog.array.forEach(cursors, function(elem, index, array) {
      console.log(elem);
      assertTrue('array[' + index + '] (' + elem + ') is not disposed',
                 goog.Disposable.isDisposed(elem));
    });
    closeAndContinue(db);
  });
}

function assertStoreDoesntExist(db) {
  try {
    db.createTransaction(['store']);
    fail('Create transaction with a non-existent store should have failed.');
  } catch (e) {
    // expected
    assertEquals(e.getName(), goog.db.Error.ErrorName.NOT_FOUND_ERR);
    closeAndContinue(db);
  }
}

function failOnError(err) {
  fail(err.message);
}

function failOnErrorEvent(ev) {
  fail(ev.target.message);
}

function closeAndContinue(db) {
  db.close();
  asyncTestCase.continueTesting();
}

function setUpPage() {
  propertyReplacer = new goog.testing.PropertyReplacer();
}

function setUp() {
  if (!idbSupported) {
    return;
  }

  // Always use a clean database by generating a new database name.
  dbName = dbBaseName + Date.now().toString();
  globalDb = openDatabase();
}

function tearDown() {
  propertyReplacer.reset();
}

function testDatabaseOpened() {
  if (!idbSupported) {
    return;
  }

  asyncTestCase.waitForAsync('check database is open');
  assertNotNull(globalDb);
  globalDb.branch().addCallback(function(db) {
    assertTrue(db.isOpen());
    closeAndContinue(db);
  }).addErrback(failOnError);
}

function testOpenWithNewVersion() {
  if (!idbSupported) {
    return;
  }

  var upgradeNeeded = false;
  asyncTestCase.waitForAsync('open with new version');
  globalDb.branch().addCallback(function(db) {
    assertEquals(baseVersion, db.getVersion());
    db.close();
    return incrementVersion(db, function(ev, db, tx) {
      upgradeNeeded = true;
    });
  }).addCallback(function(db) {
    assertTrue(upgradeNeeded);
    closeAndContinue(db);
  }).addErrback(failOnError);
}

function testManipulateObjectStores() {
  if (!idbSupported) {
    return;
  }

  asyncTestCase.waitForAsync('manipulate object stores');
  globalDb.branch().addCallback(function(db) {
    assertEquals(baseVersion, db.getVersion());
    db.close();
    return incrementVersion(db, function(ev, db, tx) {
      db.createObjectStore('basicStore');
      db.createObjectStore('keyPathStore', {keyPath: 'keyGoesHere'});
      db.createObjectStore('autoIncrementStore', {autoIncrement: true});
    });
  }).addCallback(function(db) {
    var storeNames = db.getObjectStoreNames();
    assertEquals(3, storeNames.length);
    assertTrue(storeNames.contains('basicStore'));
    assertTrue(storeNames.contains('keyPathStore'));
    assertTrue(storeNames.contains('autoIncrementStore'));
    return incrementVersion(db, function(ev, db, tx) {
      db.deleteObjectStore('basicStore');
    });
  }).addCallback(function(db) {
    var storeNames = db.getObjectStoreNames();
    assertEquals(2, storeNames.length);
    assertFalse(storeNames.contains('basicStore'));
    assertTrue(storeNames.contains('keyPathStore'));
    assertTrue(storeNames.contains('autoIncrementStore'));
    closeAndContinue(db);
  }).addErrback(failOnError);
}

function testBadObjectStoreManipulation() {
  if (!idbSupported) {
    return;
  }

  asyncTestCase.waitForAsync('bad object store manipulation');
  var expectedCode = goog.db.Error.ErrorName.INVALID_STATE_ERR;
  globalDb.branch().addCallback(function(db) {
    try {
      db.createObjectStore('diediedie');
      fail('Create object store outside transaction should have failed.');
    } catch (err) {
      // expected
      assertEquals(expectedCode, err.getName());
    }
  }).addCallback(addStore).addCallback(function(db) {
    try {
      db.deleteObjectStore('store');
      fail('Delete object store outside transaction should have failed.');
    } catch (err) {
      // expected
      assertEquals(expectedCode, err.getName());
    }
  }).addCallback(function(db) {
    return incrementVersion(db, function(ev, db, tx) {
      try {
        db.deleteObjectStore('diediedie');
        fail('Delete non-existent store should have failed.');
      } catch (err) {
        // expected
        assertEquals(goog.db.Error.ErrorName.NOT_FOUND_ERR, err.getName());
      }
    });
  }).addCallback(closeAndContinue).addErrback(failOnError);
}

function testGetNonExistentObjectStore() {
  if (!idbSupported) {
    return;
  }

  asyncTestCase.waitForAsync('get non-existent object store');
  globalDb.branch().addCallback(addStore).addCallback(function(db) {
    var tx = db.createTransaction(['store']);
    try {
      tx.objectStore('diediedie');
      fail('getting non-existent object store should have failed');
    } catch (err) {
      assertEquals(goog.db.Error.ErrorName.NOT_FOUND_ERR, err.getName());
    }
    closeAndContinue(db);
  }).addErrback(failOnError);
}

function testCreateTransaction() {
  if (!idbSupported) {
    return;
  }

  asyncTestCase.waitForAsync('create transactions');
  globalDb.branch().addCallback(addStore).addCallback(function(db) {
    var tx = db.createTransaction(['store']);
    assertEquals(
        'mode not READ_ONLY',
        goog.db.Transaction.TransactionMode.READ_ONLY,
        tx.getMode());
    tx = db.createTransaction(
        ['store'],
        goog.db.Transaction.TransactionMode.READ_WRITE);
    assertEquals(
        'mode not READ_WRITE',
        goog.db.Transaction.TransactionMode.READ_WRITE,
        tx.getMode());
    closeAndContinue(db);
  }).addErrback(failOnError);
}

function testPutRecord() {
  if (!idbSupported) {
    return;
  }

  asyncTestCase.waitForAsync('putting record');
  globalDb.branch().addCallback(addStore).addCallback(function(db) {
    var rw = goog.db.Transaction.TransactionMode.READ_WRITE;
    var COMPLETE = goog.db.Transaction.EventTypes.COMPLETE;
    var ERROR = goog.db.Transaction.EventTypes.ERROR;

    function checkForOverwrittenValue() {
      var checkOverwriteTx = db.createTransaction(['store']);
      checkOverwriteTx.objectStore('store').get('putKey').addCallback(
          function(result) {
            // this is guaranteed to run before the COMPLETE event fires on
            // the transaction
            assertEquals('overwritten', result.key);
            assertEquals('value2', result.value);
          });

      goog.events.listen(checkOverwriteTx, ERROR, failOnErrorEvent);
      goog.events.listen(checkOverwriteTx, COMPLETE, function() {
        closeAndContinue(db);
      });
    }

    function overwriteValue() {
      var overwriteTx = db.createTransaction(['store'], rw);
      overwriteTx.objectStore('store').put(
          {key: 'overwritten', value: 'value2'},
          'putKey');

      goog.events.listen(overwriteTx, ERROR, failOnErrorEvent);
      goog.events.listen(overwriteTx, COMPLETE, checkForOverwrittenValue);
    }

    function checkForInitialValue() {
      var checkResultsTx = db.createTransaction(['store']);
      checkResultsTx.objectStore('store').get('putKey').addCallback(
          function(result) {
            assertEquals('initial', result.key);
            assertEquals('value1', result.value);
          });
      goog.events.listen(checkResultsTx, ERROR, failOnErrorEvent);
      goog.events.listen(checkResultsTx, COMPLETE, overwriteValue);
    }

    var initialPutTx = db.createTransaction(['store'], rw);
    initialPutTx.objectStore('store').put(
        {key: 'initial', value: 'value1'},
        'putKey');

    goog.events.listen(initialPutTx, ERROR, failOnErrorEvent);
    goog.events.listen(initialPutTx, COMPLETE, checkForInitialValue);

  }).addErrback(failOnError);
}

function testAddRecord() {
  if (!idbSupported) {
    return;
  }

  asyncTestCase.waitForAsync('adding record');
  globalDb.branch().addCallback(addStore).addCallback(function(db) {
    var rw = goog.db.Transaction.TransactionMode.READ_WRITE;
    var COMPLETE = goog.db.Transaction.EventTypes.COMPLETE;
    var ERROR = goog.db.Transaction.EventTypes.ERROR;

    var initialAddTx = db.createTransaction(['store'], rw);
    initialAddTx.objectStore('store').add(
        {key: 'hi', value: 'something'},
        'stuff');

    goog.events.listen(initialAddTx, ERROR, failOnErrorEvent);
    goog.events.listen(initialAddTx, COMPLETE, function() {
      var successfulAddTx = db.createTransaction(['store']);
      successfulAddTx.objectStore('store').get('stuff').addCallback(
          function(result) {
            assertEquals('hi', result.key);
            assertEquals('something', result.value);
          });

      goog.events.listen(successfulAddTx, ERROR, failOnErrorEvent);
      goog.events.listen(successfulAddTx, COMPLETE, function() {
        var addOverwriteTx = db.createTransaction(['store'], rw);
        addOverwriteTx.objectStore('store').add(
            {key: 'bye', value: 'nothing'}, 'stuff').addErrback(function(err) {
          // expected
          assertEquals(
              goog.db.Error.ErrorName.CONSTRAINT_ERR,
              err.getName());
        });

        goog.events.listen(addOverwriteTx, COMPLETE, function() {
          fail('adding existing record should not have succeeded');
        });
        goog.events.listen(addOverwriteTx, ERROR, function(ev) {
          // expected
          assertEquals(
              goog.db.Error.ErrorName.CONSTRAINT_ERR,
              ev.target.getName());
          closeAndContinue(db);
        });
      });
    });
  }).addErrback(failOnError);
}

function testPutRecordKeyPathStore() {
  if (!idbSupported) {
    return;
  }

  asyncTestCase.waitForAsync('adding record, key path store');
  globalDb.branch().addCallback(function(db) {
    return incrementVersion(db, function(ev, db, tx) {
      db.createObjectStore('keyStore', {keyPath: 'key'});
    });
  }).addCallback(function(db) {
    var COMPLETE = goog.db.Transaction.EventTypes.COMPLETE;
    var ERROR = goog.db.Transaction.EventTypes.ERROR;

    var putTx = db.createTransaction(
        ['keyStore'],
        goog.db.Transaction.TransactionMode.READ_WRITE);
    putTx.objectStore('keyStore').put({key: 'hi', value: 'something'});

    goog.events.listen(putTx, ERROR, failOnErrorEvent);
    goog.events.listen(putTx, COMPLETE, function() {
      var checkResultsTx = db.createTransaction(['keyStore']);
      checkResultsTx.objectStore('keyStore').get('hi').addCallback(
          function(result) {
            assertNotUndefined(result);
            assertEquals('hi', result.key);
            assertEquals('something', result.value);
          });

      goog.events.listen(checkResultsTx, ERROR, failOnErrorEvent);
      goog.events.listen(checkResultsTx, COMPLETE, function() {
        closeAndContinue(db);
      });
    });
  }).addErrback(failOnError);
}

function testPutBadRecordKeyPathStore() {
  if (!idbSupported) {
    return;
  }

  asyncTestCase.waitForAsync('adding bad record, key path store');
  globalDb.branch().addCallback(function(db) {
    return incrementVersion(db, function(ev, db, tx) {
      db.createObjectStore('keyStore', {keyPath: 'key'});
    });
  }).addCallback(function(db) {
    var badTx = db.createTransaction(
        ['keyStore'],
        goog.db.Transaction.TransactionMode.READ_WRITE);
    badTx.objectStore('keyStore').put(
        {key: 'diedie', value: 'anything'},
        'badKey').addCallback(function() {
      fail('inserting with explicit key should have failed');
    }).addErrback(function(err) {
      // expected
      assertEquals(goog.db.Error.ErrorName.DATA_ERR, err.getName());
      closeAndContinue(db);
    });
  }).addErrback(failOnError);
}

function testPutRecordAutoIncrementStore() {
  if (!idbSupported) {
    return;
  }

  asyncTestCase.waitForAsync('adding record, auto increment store');
  globalDb.branch().addCallback(function(db) {
    return incrementVersion(db, function(ev, db, tx) {
      db.createObjectStore('aiStore', {autoIncrement: true});
    });
  }).addCallback(function(db) {
    var tx = db.createTransaction(
        ['aiStore'],
        goog.db.Transaction.TransactionMode.READ_WRITE);
    tx.objectStore('aiStore').put('1');
    tx.objectStore('aiStore').put('2');
    tx.objectStore('aiStore').put('3');
    goog.events.listen(
        tx,
        goog.db.Transaction.EventTypes.ERROR,
        failOnErrorEvent);

    goog.events.listen(tx, goog.db.Transaction.EventTypes.COMPLETE, function() {
      var tx = db.createTransaction(['aiStore']);
      tx.objectStore('aiStore').getAll().addCallback(function(results) {
        assertEquals(3, results.length);
        // only checking to see if the results are included because the keys
        // are not specified
        assertNotEquals(-1, results.indexOf('1'));
        assertNotEquals(-1, results.indexOf('2'));
        assertNotEquals(-1, results.indexOf('3'));
        closeAndContinue(db);
      });
    });
  }).addErrback(failOnError);
}

function testPutRecordKeyPathAndAutoIncrementStore() {
  if (!idbSupported) {
    return;
  }

  asyncTestCase.waitForAsync('adding record, key path + auto increment store');
  globalDb.branch().addCallback(function(db) {
    return incrementVersion(db, function(ev, db, tx) {
      db.createObjectStore('hybridStore', {
        keyPath: 'key',
        autoIncrement: true
      });
    });
  }).addCallback(function(db) {
    var tx = db.createTransaction(
        ['hybridStore'],
        goog.db.Transaction.TransactionMode.READ_WRITE);
    tx.objectStore('hybridStore').put({value: 'whatever'});
    goog.events.listen(
        tx,
        goog.db.Transaction.EventTypes.ERROR,
        failOnErrorEvent);

    goog.events.listen(tx, goog.db.Transaction.EventTypes.COMPLETE, function() {
      var tx = db.createTransaction(['hybridStore']);
      tx.objectStore('hybridStore').getAll().addCallback(function(results) {
        assertEquals(1, results.length);
        assertEquals('whatever', results[0].value);
        assertNotUndefined(results[0].key);
        closeAndContinue(db);
      });
    });
  }).addErrback(failOnError);
}

function testPutIllegalRecords() {
  if (!idbSupported) {
    return;
  }

  asyncTestCase.waitForAsync('adding illegal records');
  globalDb.branch().addCallback(addStore).addCallback(function(db) {
    var tx = db.createTransaction(
        ['store'],
        goog.db.Transaction.TransactionMode.READ_WRITE);

    tx.objectStore('store').put('death', null).addCallback(function() {
      fail('putting with null key should have failed');
    }).addErrback(function(err) {
      assertEquals(goog.db.Error.ErrorName.DATA_ERR, err.getName());
    });

    tx.objectStore('store').put('death', NaN).addCallback(function() {
      fail('putting with NaN key should have failed');
    }).addErrback(function(err) {
      assertEquals(goog.db.Error.ErrorName.DATA_ERR, err.getName());
    });

    tx.objectStore('store').put('death', undefined).addCallback(function() {
      fail('putting with undefined key should have failed');
    }).addErrback(function(err) {
      assertEquals(goog.db.Error.ErrorName.DATA_ERR, err.getName());
    });

    closeAndContinue(db);
  }).addErrback(failOnError);
}

function testPutIllegalRecordsWithIndex() {
  if (!idbSupported) {
    return;
  }

  asyncTestCase.waitForAsync('adding illegal records');
  globalDb.branch().addCallback(addStoreWithIndex).addCallback(function(db) {
    var tx = db.createTransaction(
        ['store'],
        goog.db.Transaction.TransactionMode.READ_WRITE);

    tx.objectStore('store').put({key: 'diediedie', value: null}).
        addErrback(function(err) {
          assertEquals(goog.db.Error.ErrorCode.DATA_ERR, err.code);
        });

    tx.objectStore('store').put({key: 'dietodeath', value: NaN}).
        addErrback(function(err) {
          assertEquals(goog.db.Error.ErrorCode.DATA_ERR, err.code);
        });

    tx.objectStore('store').put({key: 'dietodeath', value: undefined}).
        addErrback(function(err) {
          assertEquals(goog.db.Error.ErrorCode.DATA_ERR, err.code);
        });

    closeAndContinue(db);
  }).addErrback(failOnError);
}

function testDeleteRecord() {
  if (!idbSupported) {
    return;
  }

  asyncTestCase.waitForAsync('deleting record');
  globalDb.branch().addCallback(addStore).addCallback(function(db) {
    var rw = goog.db.Transaction.TransactionMode.READ_WRITE;
    var COMPLETE = goog.db.Transaction.EventTypes.COMPLETE;
    var ERROR = goog.db.Transaction.EventTypes.ERROR;
    var putTx = db.createTransaction(['store'], rw);
    putTx.objectStore('store').put({key: 'hi', value: 'something'}, 'stuff');

    goog.events.listen(putTx, ERROR, failOnErrorEvent);
    goog.events.listen(putTx, COMPLETE, function() {
      var deleteTx = db.createTransaction(['store'], rw);
      deleteTx.objectStore('store').remove('stuff');

      goog.events.listen(deleteTx, ERROR, failOnErrorEvent);
      goog.events.listen(deleteTx, COMPLETE, function() {
        var checkResultsTx = db.createTransaction(['store']);
        checkResultsTx.objectStore('store').get('stuff').addCallback(
            function(result) {
              assertUndefined(result);
            });

        goog.events.listen(checkResultsTx, ERROR, failOnErrorEvent);
        goog.events.listen(checkResultsTx, COMPLETE, function() {
          closeAndContinue(db);
        });
      });
    });
  }).addErrback(failOnError);
}

function testGetAll() {
  if (!idbSupported) {
    return;
  }

  var values = ['1', '2', '3'];
  var keys = ['a', 'b', 'c'];

  var addData = goog.partial(populateStore, values, keys);
  var checkStore = goog.partial(assertStoreValues, values);

  asyncTestCase.waitForAsync('getting all');
  globalDb.branch().addCallbacks(addStore, failOnError).
      addCallback(addData).
      addCallback(checkStore);
}

function testGetAllFreesCursor() {
  if (!idbSupported) {
    return;
  }
  var values = ['1', '2', '3'];
  var keys = ['a', 'b', 'c'];

  var addData = goog.partial(populateStore, values, keys);
  var origCursor = goog.db.Cursor;
  var cursors = [];
  /** @constructor */
  var testCursor = function() {
    origCursor.call(this);
    cursors.push(this);
  };
  goog.object.extend(testCursor, origCursor);
  // We don't use goog.inherits here because we are going to be overwriting
  // goog.db.Cursor and we don't want a new "base" method as
  // goog.db.Cursor.base(this, 'constructor') would be a call to
  // testCursor.base(this, 'constructor') which would be goog.db.Cursor and be
  // an infinite loop.
  testCursor.prototype = origCursor.prototype;
  propertyReplacer.replace(goog.db, 'Cursor', testCursor);
  var checkStoreAndCursorDisposed =
      goog.partial(assertStoreValuesAndCursorsDisposed, values, cursors);

  asyncTestCase.waitForAsync('getting all');
  globalDb.branch().addCallbacks(addStore, failOnError).
      addCallback(addData).
      addCallback(checkStoreAndCursorDisposed);
}

function testObjectStoreCursorGet() {
  if (!idbSupported) {
    return;
  }

  var values = ['1', '2', '3', '4'];
  var keys = ['a', 'b', 'c', 'd'];

  var addData = goog.partial(populateStore, values, keys);

  // Open the cursor over range ['b', 'c'], move in backwards direction.
  var openCursorAndCheck = function(db) {
    var cursorTx = db.createTransaction(['store']);
    var store = cursorTx.objectStore('store');
    var values = [];
    var keys = [];

    var whenTxComplete = new goog.async.Deferred();
    goog.events.listen(
        cursorTx, goog.db.Transaction.EventTypes.ERROR, failOnError);
    goog.events.listen(
        cursorTx, goog.db.Transaction.EventTypes.COMPLETE, function() {
          whenTxComplete.callback();
        });

    var whenCursorComplete = new goog.async.Deferred();
    var cursor = store.openCursor(
        goog.db.KeyRange.bound('b', 'c'),
        goog.db.Cursor.Direction.PREV);

    var key = goog.events.listen(
        cursor, goog.db.Cursor.EventType.NEW_DATA, function() {
          values.push(cursor.getValue());
          keys.push(cursor.getKey());
          cursor.next();
        });

    goog.events.listenOnce(cursor, [
      goog.db.Cursor.EventType.COMPLETE,
      goog.db.Cursor.EventType.ERROR
    ], function(evt) {
      goog.events.unlistenByKey(key);
      if (evt.type == goog.db.Cursor.EventType.COMPLETE) {
        whenCursorComplete.callback(db);
      } else {
        whenCursorComplete.errback();
      }
    });

    var whenAllComplete = goog.async.DeferredList.gatherResults([
      whenCursorComplete,
      whenTxComplete
    ]);
    whenAllComplete.addCallback(function(results) {
      var db = results[0];
      assertArrayEquals(['3', '2'], values);
      assertArrayEquals(['c', 'b'], keys);
      closeAndContinue(db);
    });
  };

  asyncTestCase.waitForAsync('getting range');
  globalDb.branch().addCallbacks(addStore, failOnError).
      addCallback(addData).
      addCallback(openCursorAndCheck);
}

function testObjectStoreCursorReplace() {
  if (!idbSupported) {
    return;
  }

  var values = ['1', '2', '3', '4'];
  var keys = ['a', 'b', 'c', 'd'];

  var addData = goog.partial(populateStore, values, keys);

  // Store should contain ['1', '2', '5', '4'] after replacement.
  var checkStore = goog.partial(assertStoreValues, ['1', '2', '5', '4']);

  // Use a bounded cursor for ('b', 'c'] to update value '3' -> '5'.
  var openCursorAndReplace = function(db) {
    var d = new goog.async.Deferred();
    var cursorTx = db.createTransaction(
        ['store'],
        goog.db.Transaction.TransactionMode.READ_WRITE);

    var whenTxComplete = new goog.async.Deferred();
    goog.events.listen(
        cursorTx, goog.db.Transaction.EventTypes.ERROR, failOnError);
    goog.events.listen(
        cursorTx, goog.db.Transaction.EventTypes.COMPLETE, function() {
          whenTxComplete.callback();
        });

    var store = cursorTx.objectStore('store');
    var whenCursorComplete = new goog.async.Deferred();
    var cursor = store.openCursor(goog.db.KeyRange.bound('b', 'c', true));

    var key = goog.events.listen(
        cursor, goog.db.Cursor.EventType.NEW_DATA, function() {
          assertEquals('3', cursor.getValue());
          cursor.update('5').addCallback(function() {
            cursor.next();
          }).addErrback(failOnError);
        });

    goog.events.listenOnce(cursor, [
      goog.db.Cursor.EventType.COMPLETE,
      goog.db.Cursor.EventType.ERROR
    ], function(evt) {
      goog.events.unlistenByKey(key);
      if (evt.type == goog.db.Cursor.EventType.COMPLETE) {
        whenCursorComplete.callback(db);
      } else {
        whenCursorComplete.errback();
      }
    });

    goog.async.DeferredList.gatherResults([
      whenCursorComplete,
      whenTxComplete
    ]).addCallbacks(function(results) {
      d.callback(results[0]);
    }, failOnError);

    return d;
  };

  // Setup and execute test case.
  asyncTestCase.waitForAsync('replacing value by cursor');
  globalDb.branch().addCallbacks(addStore, failOnError).
      addCallback(addData).
      addCallback(openCursorAndReplace).
      addCallback(checkStore);
}

function testObjectStoreCursorRemove() {
  if (!idbSupported) {
    return;
  }

  var values = ['1', '2', '3', '4'];
  var keys = ['a', 'b', 'c', 'd'];

  var addData = goog.partial(populateStore, values, keys);

  // Store should contain ['1', '2'] after removing elements.
  var checkStore = goog.partial(assertStoreValues, ['1', '2']);

  // Use a bounded cursor for ('b', ...) to remove '3', '4'.
  var openCursorAndRemove = function(db) {
    var d = new goog.async.Deferred();
    var cursorTx = db.createTransaction(
        ['store'],
        goog.db.Transaction.TransactionMode.READ_WRITE);

    var whenTxComplete = new goog.async.Deferred();
    goog.events.listen(
        cursorTx, goog.db.Transaction.EventTypes.ERROR, failOnError);
    goog.events.listen(
        cursorTx, goog.db.Transaction.EventTypes.COMPLETE, function() {
          whenTxComplete.callback();
        });


    var store = cursorTx.objectStore('store');
    var whenCursorComplete = new goog.async.Deferred();
    var cursor = store.openCursor(goog.db.KeyRange.lowerBound('b', true));

    var key = goog.events.listen(
        cursor, goog.db.Cursor.EventType.NEW_DATA, function() {
          cursor.remove('5').addCallback(function() {
            cursor.next();
          }).addErrback(failOnError);
        });

    goog.events.listenOnce(cursor, [
      goog.db.Cursor.EventType.COMPLETE,
      goog.db.Cursor.EventType.ERROR
    ], function(evt) {
      goog.events.unlistenByKey(key);
      if (evt.type == goog.db.Cursor.EventType.COMPLETE) {
        whenCursorComplete.callback(db);
      } else {
        whenCursorComplete.errback();
      }
    });

    goog.async.DeferredList.gatherResults([
      whenCursorComplete,
      whenTxComplete
    ]).addCallbacks(function(results) {
      d.callback(results[0]);
    }, failOnError);

    return d;
  };

  // Setup and execute test case.
  asyncTestCase.waitForAsync('removing value by cursor');
  globalDb.branch().addCallbacks(addStore, failOnError).
      addCallback(addData).
      addCallback(openCursorAndRemove).
      addCallback(checkStore);
}

function testClear() {
  if (!idbSupported) {
    return;
  }

  asyncTestCase.waitForAsync('clearing');
  globalDb.branch().addCallback(addStore).addCallback(function(db) {
    var rw = goog.db.Transaction.TransactionMode.READ_WRITE;
    var COMPLETE = goog.db.Transaction.EventTypes.COMPLETE;
    var ERROR = goog.db.Transaction.EventTypes.ERROR;

    var putTx = db.createTransaction(['store'], rw);
    putTx.objectStore('store').put('1', 'a');
    putTx.objectStore('store').put('2', 'b');
    putTx.objectStore('store').put('3', 'c');

    goog.events.listen(putTx, ERROR, failOnErrorEvent);
    goog.events.listen(putTx, COMPLETE, function() {
      var clearTx = db.createTransaction(['store'], rw);
      clearTx.objectStore('store').clear();

      goog.events.listen(clearTx, ERROR, failOnErrorEvent);
      goog.events.listen(clearTx, COMPLETE, function() {
        var checkResultsTx = db.createTransaction(['store']);
        checkResultsTx.objectStore('store').getAll().addCallback(
            function(results) {
              assertEquals(0, results.length);
            }).addErrback(failOnError);

        goog.events.listen(checkResultsTx, ERROR, failOnErrorEvent);
        goog.events.listen(checkResultsTx, COMPLETE, function() {
          closeAndContinue(db);
        });
      });
    });
  }).addErrback(failOnError);
}

function testAbortTransaction() {
  if (!idbSupported) {
    return;
  }

  asyncTestCase.waitForAsync('abort transaction');
  globalDb.branch().addCallback(addStore).addCallback(function(db) {
    var abortTx = db.createTransaction(
        ['store'],
        goog.db.Transaction.TransactionMode.READ_WRITE);
    abortTx.objectStore('store').put('data', 'stuff').addCallback(function() {
      abortTx.abort();
    });
    goog.events.listen(
        abortTx,
        goog.db.Transaction.EventTypes.ERROR,
        failOnErrorEvent);

    goog.events.listen(
        abortTx,
        goog.db.Transaction.EventTypes.COMPLETE,
        function() {
          fail('transaction shouldn\'t have completed after being aborted');
        });

    goog.events.listen(
        abortTx,
        goog.db.Transaction.EventTypes.ABORT,
        function() {
          var checkResultsTx = db.createTransaction(['store']);
          checkResultsTx.objectStore('store').get('stuff').addCallback(
              function(result) {
                assertUndefined(result);
              });
          goog.events.listen(
              checkResultsTx,
              goog.db.Transaction.EventTypes.COMPLETE,
              function() {
                closeAndContinue(db);
              });
        });
  }).addErrback(failOnError);
}

function testInactiveTransaction() {
  if (!idbSupported) {
    return;
  }

  asyncTestCase.waitForAsync('inactive transaction');
  globalDb.branch().addCallback(addStoreWithIndex).addCallback(function(db) {
    var tx = db.createTransaction(
        ['store'],
        goog.db.Transaction.TransactionMode.READ_WRITE);
    var store = tx.objectStore('store');
    var index = store.getIndex('index');
    store.put({key: 'something', value: 'anything'});
    goog.events.listen(tx, goog.db.Transaction.EventTypes.COMPLETE, function() {
      var expectedCode = goog.db.Error.ErrorName.TRANSACTION_INACTIVE_ERR;
      store.put({
        key: 'another',
        value: 'thing'
      }).addCallback(function() {
        fail('putting with inactive transaction should have failed');
      }).addErrback(function(err) {
        assertEquals(expectedCode, err.getName());
      });
      store.add({
        key: 'another',
        value: 'thing'
      }).addCallback(function() {
        fail('adding with inactive transaction should have failed');
      }).addErrback(function(err) {
        assertEquals(expectedCode, err.getName());
      });
      store.remove('something').addCallback(function() {
        fail('deleting with inactive transaction should have failed');
      }).addErrback(function(err) {
        assertEquals(expectedCode, err.getName());
      });
      store.get('something').addCallback(function() {
        fail('getting with inactive transaction should have failed');
      }).addErrback(function(err) {
        assertEquals(expectedCode, err.getName());
      });
      store.getAll().addCallback(function() {
        fail('getting all with inactive transaction should have failed');
      }).addErrback(function(err) {
        assertEquals(expectedCode, err.getName());
      });
      store.clear().addCallback(function() {
        fail('clearing all with inactive transaction should have failed');
      }).addErrback(function(err) {
        assertEquals(expectedCode, err.getName());
      });

      index.get('anything').
          addCallback(function() {
            fail('getting from index with inactive transaction should have ' +
                'failed');
          }).addErrback(function(err) {
            assertEquals(expectedCode, err.getName());
          });
      index.getKey('anything').
          addCallback(function() {
            fail('getting key from index with inactive transaction ' +
                'should have failed');
          }).addErrback(function(err) {
            assertEquals(expectedCode, err.getName());
          });
      index.getAll('anything').
          addCallback(function() {
            fail('getting all from index with inactive transaction ' +
                'should have failed');
          }).addErrback(function(err) {
            assertEquals(expectedCode, err.getName());
          });
      index.getAllKeys('anything').
          addCallback(function() {
            fail('getting all keys from index with inactive transaction ' +
                'should have failed');
          }).addErrback(function(err) {
            assertEquals(expectedCode, err.getName());
          });
      closeAndContinue(db);
    });
  }).addErrback(failOnError);
}

function testWrongTransactionMode() {
  if (!idbSupported) {
    return;
  }

  asyncTestCase.waitForAsync('wrong transaction mode');
  globalDb.branch().addCallback(addStore).addCallback(function(db) {
    var tx = db.createTransaction(['store']);
    assertEquals(goog.db.Transaction.TransactionMode.READ_ONLY, tx.getMode());
    tx.objectStore('store').put('KABOOM!', 'anything').addCallback(function() {
      fail('putting should have failed');
    }).addErrback(function(err) {
      assertEquals(goog.db.Error.ErrorName.READ_ONLY_ERR, err.getName());
    });
    tx.objectStore('store').add('EXPLODE!', 'die').addCallback(function() {
      fail('adding should have failed');
    }).addErrback(function(err) {
      assertEquals(goog.db.Error.ErrorName.READ_ONLY_ERR, err.getName());
    });
    tx.objectStore('store').remove('no key', 'nothing').addCallback(function() {
      fail('deleting should have failed');
    }).addErrback(function(err) {
      assertEquals(goog.db.Error.ErrorName.READ_ONLY_ERR, err.getName());
    });
    closeAndContinue(db);
  }).addErrback(failOnError);
}

function testManipulateIndexes() {
  if (!idbSupported) {
    return;
  }

  asyncTestCase.waitForAsync('index manipulation');
  globalDb.branch().addCallback(function(db) {
    return incrementVersion(db, function(ev, db, tx) {
      var store = db.createObjectStore('store');
      store.createIndex('index', 'attr1');
      store.createIndex('uniqueIndex', 'attr2', {unique: true});
      store.createIndex('multirowIndex', 'attr3', {multirow: true});
    });
  }).addCallback(function(db) {
    var tx = db.createTransaction(['store']);
    var store = tx.objectStore('store');
    var index = store.getIndex('index');
    var uniqueIndex = store.getIndex('uniqueIndex');
    var multirowIndex = store.getIndex('multirowIndex');
    try {
      var dies = store.getIndex('diediedie');
      fail('getting non-existent index should have failed');
    } catch (err) {
      assertEquals(goog.db.Error.ErrorName.NOT_FOUND_ERR, err.getName());
    }

    return tx.wait();
  }).addCallback(function(db) {
    return incrementVersion(db, function(ev, db, tx) {
      var store = tx.objectStore('store');
      store.deleteIndex('index');
      try {
        store.deleteIndex('diediedie');
        fail('deleting non-existent index should have failed');
      } catch (err) {
        assertEquals(goog.db.Error.ErrorName.NOT_FOUND_ERR, err.getName());
      }
    });
  }).addCallback(function(db) {
    var tx = db.createTransaction(['store']);
    var store = tx.objectStore('store');
    try {
      var index = store.getIndex('index');
      fail('getting deleted index should have failed');
    } catch (err) {
      assertEquals(goog.db.Error.ErrorName.NOT_FOUND_ERR, err.getName());
    }
    var uniqueIndex = store.getIndex('uniqueIndex');
    var multirowIndex = store.getIndex('multirowIndex');
  }).addCallback(closeAndContinue).addErrback(failOnError);
}

function testAddRecordWithIndex() {
  if (!idbSupported) {
    return;
  }

  asyncTestCase.waitForAsync('add record with index');
  globalDb.branch().addCallback(addStoreWithIndex).addCallback(function(db) {
    var COMPLETE = goog.db.Transaction.EventTypes.COMPLETE;
    var addTx = db.createTransaction(
        ['store'],
        goog.db.Transaction.TransactionMode.READ_WRITE);
    var store = addTx.objectStore('store');
    assertFalse(store.getIndex('index').isUnique());
    assertEquals('value', store.getIndex('index').getKeyPath());
    store.add({key: 'someKey', value: 'lookUpThis'});

    goog.events.listen(addTx, COMPLETE, function() {
      var checkResultsTx = db.createTransaction(['store']);
      var index = checkResultsTx.objectStore('store').getIndex('index');
      index.get('lookUpThis').addCallback(function(result) {
        assertNotUndefined(result);
        assertEquals('someKey', result.key);
        assertEquals('lookUpThis', result.value);
      });
      index.getKey('lookUpThis').addCallback(function(result) {
        assertNotUndefined(result);
        assertEquals('someKey', result);
      });
      goog.events.listen(
          checkResultsTx,
          goog.db.Transaction.EventTypes.ERROR,
          failOnErrorEvent);
      goog.events.listen(checkResultsTx, COMPLETE, function() {
        closeAndContinue(db);
      });
    });
  }).addErrback(failOnError);
}

function testGetMultipleRecordsFromIndex() {
  if (!idbSupported) {
    return;
  }

  asyncTestCase.waitForAsync('get multiple records from index');
  globalDb.branch().addCallback(addStoreWithIndex).addCallback(function(db) {
    var COMPLETE = goog.db.Transaction.EventTypes.COMPLETE;
    var addTx = db.createTransaction(
        ['store'],
        goog.db.Transaction.TransactionMode.READ_WRITE);
    addTx.objectStore('store').add({key: '1', value: 'a'});
    addTx.objectStore('store').add({key: '2', value: 'a'});
    addTx.objectStore('store').add({key: '3', value: 'b'});
    // The following line breaks Chrome 14, but not Chrome 15:
    // addTx.objectStore('store').add({key: '4'});
    goog.events.listen(
        addTx,
        goog.db.Transaction.EventTypes.ERROR,
        failOnErrorEvent);

    goog.events.listen(addTx, COMPLETE, function() {
      var checkResultsTx = db.createTransaction(['store']);
      var index = checkResultsTx.objectStore('store').getIndex('index');
      index.getAll().addCallback(function(results) {
        assertNotUndefined(results);
        assertEquals(3, results.length);
      });
      index.getAll('a').addCallback(function(results) {
        assertNotUndefined(results);
        assertEquals(2, results.length);
      });
      index.getAllKeys().addCallback(function(results) {
        assertNotUndefined(results);
        assertEquals(3, results.length);
      });
      index.getAllKeys('b').addCallback(function(results) {
        assertNotUndefined(results);
        assertEquals(1, results.length);
      });

      goog.events.listen(
          checkResultsTx,
          goog.db.Transaction.EventTypes.ERROR,
          failOnErrorEvent);
      goog.events.listen(checkResultsTx, COMPLETE, function() {
        closeAndContinue(db);
      });
    });
  }).addErrback(failOnError);
}

function testUniqueIndex() {
  if (!idbSupported) {
    return;
  }

  asyncTestCase.waitForAsync('adding to unique index');
  globalDb.branch().addCallback(function(db) {
    return incrementVersion(db, function(ev, db, tx) {
      var store = db.createObjectStore('store', {keyPath: 'key'});
      store.createIndex('index', 'value', {unique: true});
    });
  }).addCallback(function(db) {
    var tx = db.createTransaction(
        ['store'],
        goog.db.Transaction.TransactionMode.READ_WRITE);
    assertTrue(tx.objectStore('store').getIndex('index').isUnique());
    tx.objectStore('store').add({key: '1', value: 'a'});
    tx.objectStore('store').add({key: '2', value: 'a'});
    goog.events.listen(tx, goog.db.Transaction.EventTypes.ERROR, function(ev) {
      // expected
      assertTrue(
          'Expected DATA_ERR, CONSTRAINT_ERR, was ',
          // Chrome 21, 23+.
          goog.db.Error.ErrorName.CONSTRAINT_ERR == ev.target.getName() ||
          // Chrome 22.
          goog.db.Error.ErrorName.DATE_ERR == ev.target.getName());
      closeAndContinue(db);
    });
  }).addErrback(failOnError);
}

function testDeleteDatabase() {
  if (!idbSupported) {
    return;
  }

  asyncTestCase.waitForAsync('deleting database');
  globalDb.branch().addCallback(addStore).addCallback(function(db) {
    db.close();
    return goog.db.deleteDatabase(dbName, function() {
      fail('didn\'t expect deleteDatabase to be blocked');
    });
  }).addCallback(openDatabase).
      addCallback(assertStoreDoesntExist).
      addErrback(failOnError);
}

function testDeleteDatabaseIsBlocked() {
  if (!idbSupported) {
    return;
  }

  var wasBlocked = false;
  asyncTestCase.waitForAsync('deleting database (blocked)');
  globalDb.branch().addCallback(addStore).addCallback(function(db) {
    db.close();
    // Get a fresh connection, without any events registered on globalDb.
    return goog.db.openDatabase(dbName);
  }).addCallback(function(db) {
    return goog.db.deleteDatabase(dbName, function(ev) {
      wasBlocked = true;
      db.close();
    });
  }).addCallback(function() {
    assertTrue(wasBlocked);
    return openDatabase();
  }).addCallback(assertStoreDoesntExist).addErrback(failOnError);
}

function testBlockedDeleteDatabaseWithVersionChangeEvent() {
  if (!idbSupported) {
    return;
  }

  var gotVersionChange = false;
  asyncTestCase.waitForAsync('deleting database (blocked)');
  globalDb.branch().addCallback(addStore).addCallback(function(db) {
    db.close();
    // Get a fresh connection, without any events registered on globalDb.
    return goog.db.openDatabase(dbName);
  }).addCallback(function(db) {
    goog.events.listen(db, goog.db.IndexedDb.EventType.VERSION_CHANGE,
                       function(ev) {
          gotVersionChange = true;
          db.close();
        });
    return goog.db.deleteDatabase(dbName);
  }).addCallback(function() {
    assertTrue(gotVersionChange);
    return openDatabase();
  }).addCallback(assertStoreDoesntExist);
}

function testDeleteNonExistentDatabase() {
  if (!idbSupported) {
    return;
  }

  // Deleting non-existent db is a no-op.  Shall not throw anything.
  asyncTestCase.waitForAsync('check delete non-existent db');
  globalDb.branch().addCallback(function(db) {
    db.close();
    return goog.db.deleteDatabase('non-existent-db');
  }).addCallbacks(function() {
    asyncTestCase.continueTesting();
  }, failOnError);
}

function testObjectStoreCountAll() {
  if (!idbSupported) {
    return;
  }

  var values = ['1', '2', '3', '4'];
  var keys = ['a', 'b', 'c', 'd'];

  var addData = goog.partial(populateStore, values, keys);
  var checkCountAll = function(db) {
    var tx = db.createTransaction(['store']);
    var store = tx.objectStore('store');
    return store.count().addCallbacks(function(count) {
      assertEquals(values.length, count);
      tx.dispose();
      closeAndContinue(db);
    }, function(e) {
      tx.dispose();
      db.close();
      failOnError(e);
    });
  };

  asyncTestCase.waitForAsync('testObjectStoreCountAll');
  globalDb.branch().addCallbacks(addStore, failOnError).
      addCallback(addData).
      addCallback(checkCountAll);
}

function testObjectStoreCountSome() {
  if (!idbSupported) {
    return;
  }

  var values = ['1', '2', '3', '4'];
  var keys = ['a', 'b', 'c', 'd'];

  var addData = goog.partial(populateStore, values, keys);
  var checkCountSome = function(db) {
    var tx = db.createTransaction(['store']);
    var store = tx.objectStore('store');
    return store.count(goog.db.KeyRange.bound('b', 'c')).addCallbacks(
        function(count) {
          assertEquals(2, count);
          tx.dispose();
          closeAndContinue(db);
        }, function(e) {
          tx.dispose();
          db.close();
          failOnError(e);
        });
  };

  asyncTestCase.waitForAsync('testObjectStoreCountSome');
  globalDb.branch().addCallbacks(addStore, failOnError).
      addCallback(addData).
      addCallback(checkCountSome);
}

function testIndexCursorGet() {
  if (!idbSupported) {
    return;
  }

  var values = ['1', '2', '3', '4'];
  var keys = ['a', 'b', 'c', 'd'];

  var addData = goog.partial(populateStoreWithObjects, values, keys);

  // Open the cursor over range ['b', 'c'], move in backwards direction.
  var openCursorAndCheck = function(db) {
    var cursorTx = db.createTransaction(['store']);
    var store = cursorTx.objectStore('store');
    var index = store.getIndex('index');
    var values = [];
    var keys = [];

    var txDeferred = new goog.async.Deferred();
    goog.events.listen(
        cursorTx, goog.db.Transaction.EventTypes.ERROR, failOnError);
    goog.events.listen(
        cursorTx, goog.db.Transaction.EventTypes.COMPLETE,
        function() {
          txDeferred.callback();
        });

    var cursorDeferred = new goog.async.Deferred();
    var cursor = index.openCursor(
        goog.db.KeyRange.bound('2', '3'),
        goog.db.Cursor.Direction.PREV);

    var key = goog.events.listen(
        cursor, goog.db.Cursor.EventType.NEW_DATA,
        function() {
          values.push(cursor.getValue()['value']);
          keys.push(cursor.getValue()['key']);
          cursor.next();
        });

    goog.events.listenOnce(
        cursor,
        [goog.db.Cursor.EventType.COMPLETE, goog.db.Cursor.EventType.ERROR],
        function(evt) {
          goog.events.unlistenByKey(key);
          if (evt.type == goog.db.Cursor.EventType.COMPLETE) {
            cursorDeferred.callback(db);
          } else {
            cursorDeferred.errback();
          }
        });

    goog.async.DeferredList.gatherResults(
        [cursorDeferred, txDeferred]).addCallback(
        function(results) {
          goog.events.unlistenByKey(key);
          var db = results[0];
          assertArrayEquals(['3', '2'], values);
          assertArrayEquals(['c', 'b'], keys);
          closeAndContinue(db);
        });
  };

  asyncTestCase.waitForAsync('testIndexCursorGet');
  globalDb.branch().addCallbacks(addStoreWithIndex, failOnError).
      addCallback(addData).
      addCallback(openCursorAndCheck);
}

function testIndexCursorReplace() {
  if (!idbSupported) {
    return;
  }

  var values = ['1', '2', '3', '4'];
  var keys = ['a', 'b', 'c', 'd'];

  var addData = goog.partial(populateStoreWithObjects, values, keys);

  // Store should contain ['1', '2', '5', '4'] after replacement.
  var checkStore = goog.partial(assertStoreObjectValues, ['1', '2', '5', '4']);

  // Use a bounded cursor for ['3', '4') to update value '3' -> '5'.
  var openCursorAndReplace = function(db) {
    var d = new goog.async.Deferred();
    var cursorTx = db.createTransaction(
        ['store'],
        goog.db.Transaction.TransactionMode.READ_WRITE);

    var txDeferred = new goog.async.Deferred();
    goog.events.listen(
        cursorTx, goog.db.Transaction.EventTypes.ERROR, failOnError);
    goog.events.listen(
        cursorTx, goog.db.Transaction.EventTypes.COMPLETE,
        function() {
          txDeferred.callback();
        });

    var store = cursorTx.objectStore('store');
    var index = store.getIndex('index');
    var cursorDeferred = new goog.async.Deferred();
    var cursor = index.openCursor(
        goog.db.KeyRange.bound('3', '4', false, true));

    var key = goog.events.listen(
        cursor, goog.db.Cursor.EventType.NEW_DATA,
        function() {
          assertEquals('3', cursor.getValue()['value']);
          cursor.update(
              {
                'key': cursor.getValue()['key'],
                'value': '5'
              }).addCallback(function() {
            cursor.next();
          }).addErrback(failOnError);
        });

    goog.events.listenOnce(
        cursor,
        [goog.db.Cursor.EventType.COMPLETE, goog.db.Cursor.EventType.ERROR],
        function(evt) {
          goog.events.unlistenByKey(key);
          if (evt.type == goog.db.Cursor.EventType.COMPLETE) {
            cursorDeferred.callback(db);
          } else {
            cursorDeferred.errback();
          }
        });

    goog.async.DeferredList.gatherResults(
        [cursorDeferred, txDeferred]).addCallbacks(
        function(results) {
          goog.events.unlistenByKey(key);
          d.callback(results[0]);
        }, failOnError);

    return d;
  };

  // Setup and execute test case.
  asyncTestCase.waitForAsync('replacing value by cursor');
  globalDb.branch().addCallbacks(addStoreWithIndex, failOnError).
      addCallback(addData).
      addCallback(openCursorAndReplace).
      addCallback(checkStore);
}

function testIndexCursorRemove() {
  if (!idbSupported) {
    return;
  }

  var values = ['1', '2', '3', '4'];
  var keys = ['a', 'b', 'c', 'd'];

  var addData = goog.partial(populateStoreWithObjects, values, keys);

  // Store should contain ['1', '2'] after removing elements.
  var checkStore = goog.partial(assertStoreObjectValues, ['1', '2']);

  // Use a bounded cursor for ('2', ...) to remove '3', '4'.
  var openCursorAndRemove = function(db) {
    var d = new goog.async.Deferred();
    var cursorTx = db.createTransaction(
        ['store'],
        goog.db.Transaction.TransactionMode.READ_WRITE);

    var txDeferred = new goog.async.Deferred();
    goog.events.listen(
        cursorTx, goog.db.Transaction.EventTypes.ERROR, failOnError);
    goog.events.listen(
        cursorTx, goog.db.Transaction.EventTypes.COMPLETE,
        function() {
          txDeferred.callback();
        });


    var store = cursorTx.objectStore('store');
    var index = store.getIndex('index');
    var cursorDeferred = new goog.async.Deferred();
    var cursor = index.openCursor(goog.db.KeyRange.lowerBound('2', true));

    var key = goog.events.listen(
        cursor, goog.db.Cursor.EventType.NEW_DATA,
        function() {
          cursor.remove('5').addCallback(function() {
            cursor.next();
          }).addErrback(failOnError);
        });

    goog.events.listenOnce(
        cursor,
        [goog.db.Cursor.EventType.COMPLETE, goog.db.Cursor.EventType.ERROR],
        function(evt) {
          goog.events.unlistenByKey(key);
          if (evt.type == goog.db.Cursor.EventType.COMPLETE) {
            cursorDeferred.callback(db);
          } else {
            cursorDeferred.errback();
          }
        });

    goog.async.DeferredList.gatherResults(
        [cursorDeferred, txDeferred]).addCallbacks(
        function(results) {
          goog.events.unlistenByKey(key);
          d.callback(results[0]);
        }, failOnError);

    return d;
  };

  // Setup and execute test case.
  asyncTestCase.waitForAsync('removing value by cursor');
  globalDb.branch().addCallbacks(addStoreWithIndex, failOnError).
      addCallback(addData).
      addCallback(openCursorAndRemove).
      addCallback(checkStore);
}

function testCanWaitForTransactionToComplete() {
  if (!idbSupported) {
    return;
  }

  asyncTestCase.waitForAsync('wait for transaction to complete');
  globalDb.branch().addCallback(addStore).addCallback(function(db) {
    var tx = db.createTransaction(['store'],
        goog.db.Transaction.TransactionMode.READ_WRITE);
    tx.objectStore('store').add({key: 'hi', value: 'something'}, 'stuff');
    tx.wait().addCallbacks(closeAndContinue, failOnError);
  });
}

function testWaitingOnTransactionThatHasAnError() {
  if (!idbSupported) {
    return;
  }

  asyncTestCase.waitForAsync('adding to unique index');
  globalDb.branch().addCallback(function(db) {
    return incrementVersion(db, function(ev, db, tx) {
      var store = db.createObjectStore('store', {keyPath: 'key'});
      store.createIndex('index', 'value', {unique: true});
    });
  }).addCallback(function(db) {
    var tx = db.createTransaction(
        ['store'],
        goog.db.Transaction.TransactionMode.READ_WRITE);
    assertTrue(tx.objectStore('store').getIndex('index').isUnique());
    tx.objectStore('store').add({key: '1', value: 'a'});
    tx.objectStore('store').add({key: '2', value: 'a'});
    tx.wait().addCallbacks(
        function() {
          fail('expected transaction to fail');
        }, function(err) {
          assertTrue(
              'Expected DATA_ERR, CONSTRAINT_ERR, was ' + err.getName(),
              // Chrome 21, 23+.
              goog.db.Error.ErrorName.CONSTRAINT_ERR == err.getName() ||
              // Chrome 22.
              goog.db.Error.ErrorName.DATA_ERR == err.getName());
          closeAndContinue(db);
        });
  }).addErrback(failOnError);
}

function testWaitingOnAnAbortedTransaction() {
  if (!idbSupported) {
    return;
  }

  asyncTestCase.waitForAsync('aborting transaction');
  globalDb.branch().addCallback(addStore).addCallback(function(db) {
    var tx = db.createTransaction(['store'],
        goog.db.Transaction.TransactionMode.READ_WRITE);
    tx.wait().addCallbacks(
        function() {
          fail('Wait result should have failed');
        },
        function(e) {
          assertEquals(goog.db.Error.ErrorName.ABORT_ERR, e.getName());
          closeAndContinue(db);
        });
    tx.abort();
  });
}
