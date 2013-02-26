/**
 * @requires OpenLayers/Lang.js
 */
/**
 * Namespace: OpenLayers.Lang["ro"]
 * Dictionary for Romanian.  Keys for entries are used in calls to
 *     <OpenLayers.Lang.translate>.  Entry bodies are normal strings or
 *     strings formatted for use with <OpenLayers.String.format> calls.
*/
OpenLayers.Lang.ro = {
    'unhandledRequest': "Cerere nesoluționată return ${statusText}",
    'Permalink': "Legatură permanentă",
    'Overlays': "Straturi vector",
    'Base Layer': "Straturi de bază",
    'noFID': "Nu pot actualiza un feature pentru care nu există FID.",
    'browserNotSupported':
        "Browserul tău nu suportă afișarea vectorilor. Supoetul curent pentru randare:\n${renderers}",
    // console message
    'minZoomLevelError':
        "Proprietatea minZoomLevel este doar pentru a fi folosită " +
        "cu straturile FixedZoomLevels-descendent. De aceea acest " +
        "strat wfs verifică dacă minZoomLevel este o relicvă" +
        ". Nu îl putem , oricum, înlătura fără " +
        "a afecta aplicațiile Openlayers care depind de ea." +
        " De aceea considerăm depreciat -- minZoomLevel " +
        "și îl vom înlătura în 3.0. Folosește " +
        "min/max resolution cum este descrisă aici: " +
        "http://trac.openlayers.org/wiki/SettingZoomLevels",
    'commitSuccess': "Tranzacție WFS: SUCCES ${response}",
    'commitFailed': "Tranzacție WFS : EȘEC ${response}",
    'googleWarning':
        "Stratul Google nu a putut fi încărcat corect.<br><br>" +
        "Pentru a elimina acest mesaj, selectează un nou strat de bază " +
        "în Layerswitcher din colțul dreata-sus.<br><br>" +
        "Asta datorită, faptului că Google Maps library " +
        "script nu este inclus, sau nu conține " +
        "cheia API corectă pentru situl tău.<br><br>" +
        "Developeri: Pentru ajutor, " +
        "<a href='http://trac.openlayers.org/wiki/Google' " +
        "target='_blank'>apăsați aici</a>",
    'getLayerWarning':
        "Stratul ${layerType} nu a putut fi încărcat corect.<br><br>" +
        "pentru a înlătura acest mesaj, selectează un nou strat de bază " +
        "Acesta eroare apare de obicei când ${layerLib} library " +
        "script nu a fost încărcat corect.<br><br>" +
        "Developeri: Pentru ajutor privind utilizarea corectă, " +
        "<a href='http://trac.openlayers.org/wiki/${layerLib}' " +
        "target='_blank'>apasă aici</a>",
    'Scale = 1 : ${scaleDenom}': "Scara = 1 : ${scaleDenom}",
    //labels for the graticule control
    'W': 'V',
    'E': 'E',
    'N': 'N',
    'S': 'S',
    'Graticule': 'Graticule',
    // console message
    'reprojectDeprecated':
        "folosești opțiunea 'reproject' " +
        "pentru stratul ${layerName} . Această opțiune este depreciată: " +
        "a fost utilizată pentru afișarea straturilor de bază comerciale " + 
        "Mai multe informații despre proiecția Mercator sunt disponibile aici " +
        "http://trac.openlayers.org/wiki/SphericalMercator.",
    // console message
    'methodDeprecated':
        "Această metodă este depreciată și va fi înlăturată in versiunea 3.0. " +
        "folosește metoda ${newMethod}.",
    // **** end ****
    'end': ''
};
