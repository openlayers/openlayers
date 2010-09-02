/*

  throws.js -- Adds a `throws_` method to AnotherWay test objects.

  Copyright 2005 OpenLayers Contributors. released under the BSD License.


  A reference to this file needs to be added to `run-tests.html` in the
  head element after the AnotherWay classes are created:

    <script type="text/javascript" src="throws.js"></script>

  Then, it can be used just like the `ok`, `fail` and other such methods
  in your unit tests.

  e.g. 

   t.throws_(function () {new OpenLayers.View.Map.Dynamic();},
             ReferenceError("No container supplied."),
             "OpenLayers.View.Map.Dynamic instantiation with no container "
             + "must throw.");

  This was inspired by the `assertRaises` method of Python's unittest
  library.

  Possible future enhancements:

    * Contribute to official AnotherWay distribution.
    * Use `apply` rather than require a inner function (or as an option).
    * Preserve the stack fields.

 */

Test.AnotherWay._test_object_t.prototype.throws_ = 
function (fn, expectedException, doc) {
    /*
      
       Executes the supplied function object catching any exception(s)
       thrown, then verifies the supplied expected exception occurred.
      
       If no exception is thrown the test fails.

       If an exception is thrown and it does not match the supplied
       expected exception the test fails.

       If the exception thrown matches the supplied expected exception
       the test passes.

       Two exceptions "match" if Test.AnotherWay's `eq` method considers
       the two equal when their respective stacks are ignored.

                      fn - The function object to be executed
       expectedException - The exception object expected to result
                     doc - Description of the test

       Note: The name of this method is `throws_` (with a trailing
             underscore) as `throws` is a reserved identifier and can
             not be used as a method name.

       Note: This function does not preserve the stack field associated
             with either exception.

     */
    var theCaughtException = null;

    try {
        fn();
    } catch (innerCaughtException) {
        // As `innerCaughtException` is not visible outside the scope
        // of this `catch` block we need to make it visible explicitly. 
        theCaughtException = innerCaughtException;
    }

    if (theCaughtException) {
        // We delete the stacks before comparison as they will never match.
        delete theCaughtException.stack;
        delete expectedException.stack;
        this.eq(theCaughtException, expectedException, doc);
    } else {
        this.fail(doc);
    }
};
