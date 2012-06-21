// the following code includes the sourc-files of OpenLayers as they are
// defined in ol.js.
//
// You can control in which form the source will be loaded by passing
// URL-parameters:
//
//   - host
//     where the plovr compiler is running, if not passed this defaults to the
//     current host on port 9810
//
//   - mode
//     which mode of compilation should be applied. Common values for this are
//     RAW, SIMPLE or ADVANCED. If not provided, SIMPLE is used.
(function(doc, l){
    var hostRegex = /[\\?&]host=([^&#]*)/,
        modeRegex = /[\\?&]mode=([^&#]*)/,
        hostResult = hostRegex.exec(l.href),
        modeResult = modeRegex.exec(l.href),
        host = (hostResult && hostResult[1])
            ? hostResult[1]
            : (l.host)
                ? l.host + ':9810'
                : 'localhost:9810',
        mode = (modeResult && modeResult[1])
            ? modeResult[1]
            : 'SIMPLE',
        script = '<sc' + 'ript type="text/javascript" '
            + 'src="http://' + host + '/compile?id=ol&amp;mode=' + mode + '">'
            + '</scr' + 'ipt>';
    doc.write(script);
})(document, location);