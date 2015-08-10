define(function(require) {

  var Model = require('lavaca/mvc/Model'),
      Promise = require('lavaca/util/Promise');

  var AnalyzeModel = Model.extend(function() {
    Model.apply(this, arguments);
  });

  return new AnalyzeModel();
});