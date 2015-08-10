require.config({
  baseUrl: 'js',
  paths: {
    'es5-shim': '../components/es5-shim/es5-shim',
    '$': '../components/jquery/jquery',
    'jquery': '../components/jquery/jquery',
    'hammer': '../components/hammerjs/dist/jquery.hammer',
    'mout': '../components/mout/src',
    'dust': '../components/dustjs-linkedin/dist/dust-full-2.0.4',
    'dust-helpers': '../components/dustjs-linkedin-helpers/dist/dust-helpers-1.1.1',
    'rdust': '../components/require-dust/require-dust',
    'iScroll': '../components/iscroll/dist/iscroll-lite-min',
    'lavaca': '../components/lavaca/src',
    'underscore': '../components/underscore/underscore',
    'd3': '../components/d3',
    'd3Tip': '../components/d3Tip',
    'jqUi': '../components/jqUi',
    'dust-extensions': '../components/dust-extensions'
  },
  shim: {
    $: {
      exports: '$'
    },
    jquery: {
      exports: '$'
    },
    hammer: {
      deps: ['$'],
      exports: 'Hammer'
    },
    d3: {
      exports: 'd3'
    },
    d3Tip: {
      deps: ['d3'],
      exports: 'd3Tip'
    },
    jqUi: {
      deps: ['$'],
      exports: 'jqUi'
    },
    dust: {
      exports: 'dust'
    },
    'dust-helpers': {
      deps: ['dust']
    },
    'dust-extensions': {
      deps: ['dust'],
      exports: 'dust-extensions'
    }
  }
});
require(['es5-shim']);
require(['app/app']);