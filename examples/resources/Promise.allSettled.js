if (typeof Promise !== 'undefined' && !Promise.allSettled && Array.from) {
  Promise.allSettled = 
    function (promises) {
      return Promise.all(
        Array.from(
          promises,
          function (p) {
            return p.then (
              function (value) {
                return {status: 'fulfilled', value: value};
              }
            ).catch(
              function (reason) {
                return {status: 'rejected', reason: reason};
              }
            );
          }
        )
      )
    };
}
