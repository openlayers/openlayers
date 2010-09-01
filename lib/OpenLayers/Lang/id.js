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

    'permalink': "Pranala permanen",

    'overlays': "Hamparan",

    'baseLayer': "Lapisan Dasar",

    'sameProjection': "Peta tinjauan hanya bekerja bila dalam proyeksi yang sama dengan peta utama",

    'readNotImplemented': "Membaca tidak diterapkan.",

    'writeNotImplemented': "Menyimpan tidak diterapkan.",

    'noFID': "Tidak dapat memperbarui fitur yang tidak memiliki FID.",

    'errorLoadingGML': "Kesalahan dalam memuat berkas GML ${url}",

    'browserNotSupported': "Peramban Anda tidak mendukung penggambaran vektor. Penggambar yang didukung saat ini adalah:\n${renderers}",

    'componentShouldBe': "addFeatures : komponen harus berupa ${geomType}",

    'getFeatureError': "getFeatureFromEvent diterapkan pada lapisan tanpa penggambar. Ini biasanya berarti Anda menghapus sebuah lapisan, tetapi tidak menghapus penangan yang terkait dengannya.",

    'minZoomLevelError': "Properti minZoomLevel hanya ditujukan bekerja dengan lapisan FixedZoomLevels-descendent. Pengecekan minZoomLevel oleh lapisan wfs adalah peninggalan masa lalu. Kami tidak dapat menghapusnya tanpa kemungkinan merusak aplikasi berbasis OL yang mungkin bergantung padanya. Karenanya, kami menganggapnya tidak berlaku -- Cek minZoomLevel di bawah ini akan dihapus pada 3.0. Silakan gunakan penyetelan resolusi min/maks seperti dijabarkan di sini: http://trac.openlayers.org/wiki/SettingZoomLevels",

    'commitSuccess': "WFS Transaksi: BERHASIL ${respon}",

    'commitFailed': "WFS Transaksi: GAGAL ${respon}",

    'googleWarning': "Lapisan Google tidak dapat dimuat dengan benar.\x3cbr\x3e\x3cbr\x3eUntuk menghilangkan pesan ini, pilih suatu BaseLayer baru melalui penukar lapisan (layer switcher) di ujung kanan atas.\x3cbr\x3e\x3cbr\x3eKemungkinan besar ini karena pustaka skrip Google Maps tidak disertakan atau tidak mengandung kunci API yang tepat untuk situs Anda.\x3cbr\x3e\x3cbr\x3ePengembang: Untuk bantuan mengatasi masalah ini, \x3ca href=\'http://trac.openlayers.org/wiki/Google\' target=\'_blank\'\x3eklik di sini\x3c/a\x3e",

    'getLayerWarning': "Lapisan ${layerType} tidak dapat dimuat dengan benar.\x3cbr\x3e\x3cbr\x3eUntuk menghilangkan pesan ini, pilih suatu BaseLayer baru melalui penukar lapisan (layer switcher) di ujung kanan atas.\x3cbr\x3e\x3cbr\x3eKemungkinan besar ini karena pustaka skrip Google Maps tidak disertakan dengan benar.\x3cbr\x3e\x3cbr\x3ePengembang: Untuk bantuan mengatasi masalah ini, \x3ca href=\'http://trac.openlayers.org/wiki/${layerLib}\' target=\'_blank\'\x3eklik di sini\x3c/a\x3e",

    'scale': "Sekala = 1 : ${scaleDenom}",

    'W': "B",

    'E': "T",

    'N': "U",

    'S': "S",

    'layerAlreadyAdded': "Anda mencoba menambahkan lapisan: ${layerName} ke dalam peta, tapi lapisan itu telah ditambahkan",

    'reprojectDeprecated': "Anda menggunakan opsi \'reproject\' pada lapisan ${layerName}. Opsi ini telah ditinggalkan: penggunaannya dirancang untuk mendukung tampilan data melalui peta dasar komersial, tapi fungsionalitas tersebut saat ini harus dilakukan dengan menggunakan dukungan Spherical Mercator. Informasi lebih lanjut tersedia di http://trac.openlayers.org/wiki/SphericalMercator.",

    'methodDeprecated': "Metode ini telah usang dan akan dihapus di 3.0. Sebaliknya, harap gunakan ${newMethod}.",

    'boundsAddError': "Anda harus memberikan kedua nilai x dan y ke fungsi penambah.",

    'lonlatAddError': "Anda harus memberikan kedua nilai lon dan lat ke fungsi penambah.",

    'pixelAddError': "Anda harus memberikan kedua nilai x dan y ke fungsi penambah.",

    'unsupportedGeometryType': "Tipe geometri tak didukung: ${geomType}",

    'pagePositionFailed': "OpenLayers.Util.pagePosition gagal: elemen dengan id ${elemId} mungkin salah tempat.",

    'filterEvaluateNotImplemented': "evaluasi tidak tersedia untuk tipe filter ini."

});
