function waitsFor(condition, message, timeout, callback) {
  var timeWaiting = 0;

  function inner() {
    if (condition()) {
      callback();
      return;
    }

    if (timeWaiting >= timeout) {
      throw new Error(message);
    }

    timeWaiting += 10;
    setTimeout(inner, 10);
  }

  inner();
}


expect.Assertion.prototype.roughlyEqual = function(other, tol) {
  return Math.abs(this.actual - other) <= tol;
};
