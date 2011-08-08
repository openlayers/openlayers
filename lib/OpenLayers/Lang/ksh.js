/* Translators (2009 onwards):
 *  - Purodha
 */

/**
 * @requires OpenLayers/Lang.js
 */

/**
 * Namespace: OpenLayers.Lang["ksh"]
 * Dictionary for Ripoarisch.  Keys for entries are used in calls to
 *     <OpenLayers.Lang.translate>.  Entry bodies are normal strings or
 *     strings formatted for use with <OpenLayers.String.format> calls.
 */
OpenLayers.Lang["ksh"] = OpenLayers.Util.applyDefaults({

    'unhandledRequest': "Met dä Antwoot op en Aanfrooch ham_mer nix aanjefange: ${statusText}",

    'Permalink': "Lengk op Duuer",

    'Overlays': "Drövver jelaat",

    'Base Layer': "Jrund-Nivoh",

    'readNotImplemented': "„\x3ccode lang=\"en\"\x3eread\x3c/code\x3e“ is em Projramm nit fürjesinn.",

    'writeNotImplemented': "„\x3ccode lang=\"en\"\x3ewrite\x3c/code\x3e“ is em Projramm nit fürjesinn.",

    'noFID': "En Saach, woh kein \x3ci lang=\"en\"\x3eFID\x3c/i\x3e för doh es, löht sesch nit ändere.",

    'errorLoadingGML': "Fähler beim \x3ci lang=\"en\"\x3eGML\x3c/i\x3e-Datei-Laade vun \x3ccode\x3e${url}\x3c/code\x3e",

    'browserNotSupported': "Dinge Brauser kann kein Väktore ußjävve. De Zoote Ußjaabe, di em Momang jon, sen:\n${renderers}",

    'componentShouldBe': "\x3ccode lang=\"en\"\x3eaddFeatures\x3c/code\x3e: dä Aandeil sullt vun dä Zoot „\x3ccode lang=\"en\"\x3e${geomType}\x3c/code\x3e“ sin.",

    'getFeatureError': "\x3ccode lang=\"en\"\x3egetFeatureFromEvent\x3c/code\x3e es vun enem Nivoh opjeroofe woode, woh et kei Projramm zom Ußjävve jit. Dat bedügg för jewöhnlesch, dat De e Nivoh kapott jemaat häs, ävver nit e Projramm för domet ömzejonn, wat domet verbonge es.",

    'minZoomLevelError': "De Eijeschaff „\x3ccode lang=\"en\"\x3eminZoomLevel\x3c/code\x3e“ es bloß doför jedaach, dat mer se met dä Nivvohß bruch, di vun \x3ccode lang=\"en\"\x3eFixedZoomLevels\x3c/code\x3e affhange don. Dat dat \x3ci lang=\"en\"\x3eWFS\x3c/i\x3e-Nivvoh övverhoup de Eijeschaff „\x3ccode lang=\"en\"\x3eminZoomLevel\x3c/code\x3e“ pröhfe deiht, es noch övveresch vun fröhjer. Mer künne dat ävver jez nit fott lohße, oohne dat mer Jevaa loufe, dat Aanwendunge vun OpenLayers nit mieh loufe, di sesch doh velleijsch noch drop am verlohße sin. Dröm sare mer, dat mer et nit mieh han welle, un de „\x3ccode lang=\"en\"\x3eminZoomLevel\x3c/code\x3e“-Eijeschaff weed hee vun de Version 3.0 af nit mieh jeprööf wäde. Nemm doför de Enstellung för de hühßte un de kleinßte Oplöhsung, esu wi et en http://trac.openlayers.org/wiki/SettingZoomLevels opjeschrevve es.",

    'commitSuccess': "Dä \x3ci lang=\"en\"\x3eWFS\x3c/i\x3e-Vörjang es joot jeloufe: ${response}",

    'commitFailed': "Dä \x3ci lang=\"en\"\x3eWFS\x3c/i\x3e-Vörjang es scheif jejange: ${response}",

    'googleWarning': "Dat Nivvoh \x3ccode lang=\"en\"\x3eGoogle\x3c/code\x3e kunnt nit reschtesch jelaade wääde.\x3cbr /\x3e\x3cbr /\x3eÖm hee di Nohreesch loß ze krijje, donn en ander Jrund-Nivvoh ußsöhke, rähß bovve en de Äk.\x3cbr /\x3e\x3cbr /\x3eWascheinlesch es dat wiel dat \x3ci lang=\"en\"\x3eGoogle-Maps\x3c/i\x3e-Skrepp entweeder nit reschtesch enjebonge wood, udder nit dä reschtejje \x3ci lang=\"en\"\x3eAPI\x3c/i\x3e-Schlößel för Ding Web-ßait scheke deiht.\x3cbr /\x3e\x3cbr /\x3eFör Projrammierer jidd_et Hölp do_drövver, \x3ca href=\"http://trac.openlayers.org/wiki/Google\" target=\"_blank\"\x3ewi mer dat aan et Loufe brengk\x3c/a\x3e.",

    'getLayerWarning': "Dat Nivvoh \x3ccode\x3e${layerType}\x3c/code\x3e kunnt nit reschtesch jelaade wääde.\x3cbr /\x3e\x3cbr /\x3eÖm hee di Nohreesch loß ze krijje, donn en ander Jrund-Nivvoh ußsöhkre, rähß bovve en de Äk.\x3cbr /\x3e\x3cbr /\x3eWascheinlesch es dat, wiel dat Skrepp \x3ccode\x3e${layerLib}\x3c/code\x3e nit reschtesch enjebonge wood.\x3cbr /\x3e\x3cbr /\x3eFör Projrammierer jidd_Et Hölp do_drövver, \x3ca href=\"http://trac.openlayers.org/wiki/${layerLib}\" target=\"_blank\"\x3ewi mer dat aan et Loufe brengk\x3c/a\x3e.",

    'Scale = 1 : ${scaleDenom}': "Mohßshtaab = 1 : ${scaleDenom}",

    'W': "W",

    'E': "O",

    'N': "N",

    'S': "S",

    'layerAlreadyAdded': "Do häß versöhk, dat Nivvoh \x3ccode\x3e${layerName}\x3c/code\x3e en di Kaat eren ze bränge, et wohr ävver ald do dren.",

    'reprojectDeprecated': "Do bruchs de Ußwahl \x3ccode\x3ereproject\x3c/code\x3e op däm Nivvoh \x3ccode\x3e${layerName}\x3c/code\x3e. Di Ußwahl es nit mieh jähn jesinn. Se wohr doför jedaach, öm Date op jeschääfsmäßesch eruß jejovve Kaate bovve drop ze moole, wat ävver enzwesche besser met dä Öngershtözung för de ßfääresche Mäkaator Beldscher jeiht. Doh kanns De mieh drövver fenge op dä Sigg: http://trac.openlayers.org/wiki/SphericalMercator.",

    'methodDeprecated': "Hee di Metood es nim_mih aktoäll un et weed se en dä Version 3.0 nit mieh jävve. Nemm \x3ccode\x3e${newMethod}\x3c/code\x3e doföör.",

    'boundsAddError': "Do moß beeds vun de \x3ccode\x3ex\x3c/code\x3e un \x3ccode\x3ey\x3c/code\x3e Wääte aan de Fungkßjohn \x3ccode\x3eadd\x3c/code\x3e jävve.",

    'lonlatAddError': "Do moß beeds \x3ccode\x3elon\x3c/code\x3e un \x3ccode\x3elat\x3c/code\x3e aan de Fungkßjohn \x3ccode\x3eadd\x3c/code\x3e jävve.",

    'pixelAddError': "Do moß beeds \x3ccode\x3ex\x3c/code\x3e un \x3ccode\x3ey\x3c/code\x3e aan de Fungkßjohn \x3ccode\x3eadd\x3c/code\x3e jävve.",

    'unsupportedGeometryType': "De Zoot Jommetrii dom_mer nit ongershtöze: \x3ccode\x3e${geomType}\x3c/code\x3e",

    'filterEvaluateNotImplemented': "„\x3ccode lang=\"en\"\x3eevaluate\x3c/code\x3e“ es för di Zoot Fellter nit enjereschdt."

});
