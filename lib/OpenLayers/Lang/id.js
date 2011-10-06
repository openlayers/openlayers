/* Translators (2009 onwards):
 *  - Irwangatot
 *  - IvanLanin
 */

/**
 * @requires OpenLayers/Lang.js
 */

/**
 * Namespace: OpenLayers.Lang["id"]
 * Dictionary for Bahasa Indonesia.  Keys for entries are used in calls to
 *     <OpenLayers.Lang.translate>.  Entry bodies are normal strings or
 *     strings formatted for use with <OpenLayers.String.format> calls.
 */
OpenLayers.Lang["id"] = OpenLayers.Util.applyDefaults({

    'unhandledRequest': "Permintaan yang tak tertangani menghasilkan ${statusText}",

    'Permalink': "Pranala permanen",

    'Overlays': "Hamparan",

    'Base Layer': "Lapisan Dasar",

    'noFID': "Tidak dapat memperbarui fitur yang tidak memiliki FID.",

    'browserNotSupported': "Peramban Anda tidak mendukung penggambaran vektor. Penggambar yang didukung saat ini adalah:\n${renderers}",

    'minZoomLevelError': "Properti minZoomLevel hanya ditujukan bekerja dengan lapisan FixedZoomLevels-descendent. Pengecekan minZoomLevel oleh lapisan wfs adalah peninggalan masa lalu. Kami tidak dapat menghapusnya tanpa kemungkinan merusak aplikasi berbasis OL yang mungkin bergantung padanya. Karenanya, kami menganggapnya tidak berlaku -- Cek minZoomLevel di bawah ini akan dihapus pada 3.0. Silakan gunakan penyetelan resolusi min/maks seperti dijabarkan di sini: http://trac.openlayers.org/wiki/SettingZoomLevels",

    'commitSuccess': "WFS Transaksi: BERHASIL ${respon}",

    'commitFailed': "WFS Transaksi: GAGAL ${respon}",

    'googleWarning': "Lapisan Google tidak dapat dimuat dengan benar.\x3cbr\x3e\x3cbr\x3eUntuk menghilangkan pesan ini, pilih suatu BaseLayer baru melalui penukar lapisan (layer switcher) di ujung kanan atas.\x3cbr\x3e\x3cbr\x3eKemungkinan besar ini karena pustaka skrip Google Maps tidak disertakan atau tidak mengandung kunci API yang tepat untuk situs Anda.\x3cbr\x3e\x3cbr\x3ePengembang: Untuk bantuan mengatasi masalah ini, \x3ca href=\'http://trac.openlayers.org/wiki/Google\' target=\'_blank\'\x3eklik di sini\x3c/a\x3e",

    'getLayerWarning': "Lapisan ${layerType} tidak dapat dimuat dengan benar.\x3cbr\x3e\x3cbr\x3eUntuk menghilangkan pesan ini, pilih suatu BaseLayer baru melalui penukar lapisan (layer switcher) di ujung kanan atas.\x3cbr\x3e\x3cbr\x3eKemungkinan besar ini karena pustaka skrip Google Maps tidak disertakan dengan benar.\x3cbr\x3e\x3cbr\x3ePengembang: Untuk bantuan mengatasi masalah ini, \x3ca href=\'http://trac.openlayers.org/wiki/${layerLib}\' target=\'_blank\'\x3eklik di sini\x3c/a\x3e",

    'Scale = 1 : ${scaleDenom}': "Sekala = 1 : ${scaleDenom}",

    'W': "B",

    'E': "T",

    'N': "U",

    'S': "S",

    'reprojectDeprecated': "Anda menggunakan opsi \'reproject\' pada lapisan ${layerName}. Opsi ini telah ditinggalkan: penggunaannya dirancang untuk mendukung tampilan data melalui peta dasar komersial, tapi fungsionalitas tersebut saat ini harus dilakukan dengan menggunakan dukungan Spherical Mercator. Informasi lebih lanjut tersedia di http://trac.openlayers.org/wiki/SphericalMercator.",

    'methodDeprecated': "Metode ini telah usang dan akan dihapus di 3.0. Sebaliknya, harap gunakan ${newMethod}."

});
