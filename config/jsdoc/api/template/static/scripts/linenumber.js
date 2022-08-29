(function() {
    const source = document.querySelector('.prettyprint.source > code');
    if (source) {
        source.innerHTML = source.innerHTML
            .split('\n')
            .map(function (item, i) {
                return '<span id="line' + (i + 1) + '"></span>' + item;
            })
            .join('\n');
    }
})();
