define(function(require) {

  var BaseController = require('app/net/BaseController'),
      Collection = require('app/models/AppCollection'),
      Promise = require('lavaca/util/Promise'),
      AnalyzeView = require('app/ui/views/AnalyzeView'),
      Model = require('app/models/AnalyzeModel');

  var AnalyzeController = BaseController.extend({
    analyze: function(params, history) {
      var id = params.appId ? params.appId : 333903271,
          country = params.country ? params.country : 'us';

      Collection.checkCollection({'appId': id, 'country': country, 'model': 'AnalyzeModel'});

      var url = '/analyze?appId=' + id +'&country=' + country;

      Model.apply({'term': params.term});

      return this
        .view(null, AnalyzeView, Model)
        .then(this.updateState(history, 'Otter - Analyze App', url));
      }
  });

  return AnalyzeController;

});
