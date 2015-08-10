define(function(require) {
  var dust = require('dust');

  /* ------- Date Formatting ------- */
  (function() {

    dust.filters.numFormat = function(number) {
      var n = number.toFixed(2);
      return n;
    };

  })();
});