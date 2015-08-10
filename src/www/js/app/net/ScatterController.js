define(function(require) {

  var BaseController = require('app/net/BaseController'),
      Collection = require('app/models/AppCollection'),
      Promise = require('lavaca/util/Promise'),
      Service = require('app/data/Service'),
      SidebarView = require('app/ui/views/controls/SidebarView'),
      ScatterView = require('app/ui/views/ScatterView'),
      Model = require('app/models/ScatterModel');

  var ScatterController = BaseController.extend({
    scatter: function(params, history) {
      var term = (params.company || params.industry) ? (params.company || params.industry) : (params.industry ? 'banking' : 'Facebook, Inc.'),
          country = params.country ? params.country : 'us';

        if (params.company) {
          Collection.getCompany(term, country);
        } else if (params.industry) {
          Collection.getIndustryApps(term, country);
        }
      
      SidebarView.configure('scatter' + (params.industry ? ' industry' : ' company'));
      
      SidebarView.scatterState = params;

      if (params.industry) {
        var url = '/scatter?industry=' + term +'&country=' + country;
      } else {
        var url = '/scatter?company=' + term +'&country=' + country;
      }
     
      return this
        .view(null, ScatterView, Model)
        .then(this.updateState(history, 'Otter - Scatter Plot', url));
      }
  });

  return ScatterController;

});
