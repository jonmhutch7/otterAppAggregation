define(function(require) {
  var History = require('lavaca/net/History');
  var CompareController = require('./net/CompareController');
  var AnalyzeController = require('./net/AnalyzeController');
  var ScatterController = require('./net/ScatterController');
  var Connectivity = require('lavaca/net/Connectivity');
  var Application = require('lavaca/mvc/Application');
  var Translation = require('lavaca/util/Translation');
  var SidebarView = require('app/ui/views/controls/SidebarView');
  require('lavaca/ui/DustTemplate');
  require('dust-extensions');
  require('hammer');


  // Uncomment this section to use hash-based browser history instead of HTML5 history.
  // You should use hash-based history if there's no server-side component supporting your app's routes.
  //History.overrideStandardsMode();

  /**
   * Global application-specific object
   * @class app
   * @extends Lavaca.mvc.Application
   */
  var app = new Application(function() {
    // Add routes
    this.router.add({
      '/': [CompareController, 'compare'],
      '/compare': [CompareController, 'compare'],
      '/analyze': [AnalyzeController, 'analyze'],
      '/scatter': [ScatterController, 'scatter']
    });
    // Initialize messages
    Translation.init('en_US');
    SidebarView.render();

    $('.popup-close').on('tap', function() {
      $('.help-popup').fadeToggle();
    });

  });

  // Setup offline AJAX handler
  Connectivity.registerOfflineAjaxHandler(function() {
    var hasLoaded = Translation.hasLoaded;
    alert(hasLoaded ? Translation.get('error_offline') : 'No internet connection available. Please check your settings and connection and try again.');
  });

  dust.helpers['getVersion'] = function(data) {
    return '<div style="color: red;">' + data + '</div>';;
  };

  return app;

});