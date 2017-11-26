goog.provide('ol.coverage.MatrixType');

goog.require('ol');

if (ol.ENABLE_COVERAGE) {

  /**
   * A coverage data type of the following values: `8bitUnsignedInteger`, `8bitInteger`,
   * `16bitUnsignedInteger`, `16bitInteger`, `32bitUnsignedInteger`, `32bitInteger`,
   * `32bitFloat`, `64bitFloat`.
   * @enum {string}
   */
  ol.coverage.MatrixType = {
    UINT8: '8bitUnsignedInteger',
    INT8: '8bitInteger',
    UINT16: '16bitUnsignedInteger',
    INT16: '16bitInteger',
    UINT32: '32bitUnsignedInteger',
    INT32: '32bitInteger',
    FLOAT32: '32bitFloat',
    FLOAT64: '64bitFloat'
  };

}
