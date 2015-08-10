define(function(require) {
  var BaseView = require('./BaseView'),
      SidebarView = require('app/ui/views/controls/SidebarView'),
      AnalyzeView = require('app/ui/views/AnalyzeView'),
      Detection = require('lavaca/env/Detection'),
      Model = require('lavaca/mvc/Model'),
      router = require('lavaca/mvc/Router');
  require('rdust!templates/compare');
  /**
   * Compare view type
   * @class app.ui.views.CompareView
   * @extends app.ui.views.BaseView
   */
  var CompareView = BaseView.extend(function(){
    BaseView.apply(this, arguments);

    this.mapEvent({
      model:{
        'reset': this.reset.bind(this)
      }
    });

  }, {
    /**
     * The name of the template used by the view
     * @property {String} template
     * @default 'home'
     */
    template: 'templates/compare',
    /**
     * A class name added to the view container
     * @property {String} className
     * @default 'compare'
     */
    className: 'compare',
    sectionAmt: 0,
    filterTerm: null,
    onRenderSuccess: function() {
      BaseView.prototype.onRenderSuccess.apply(this, arguments);
      $('.appHolder').addClass('hidden');

      SidebarView.configure('compare');

      if (this.model.count() > 0) {
        setTimeout(function() {
          this.addGraphs();
        }.bind(this), 200);
      }
    },
    reset: function() {
      var self = this;
      this.redraw().then(function() {
        self.addGraphs();
      });
    },
    addGraphs: function() {
      $('.d3-tip, .d3-tip2').remove();         

      this.setSectionAmt();

      var self = this;

      this.model.each(function(index) {
        var element = '.appHolder[data-num="' + index + '"] #chart',
            parent = '.appHolder[data-num="' + index + '"]',
            data = this.models[index].toObject(),
            exists = ($('#comparison').text().indexOf(data.name) > -1),
            orientation = window.innerHeight > window.innerWidth,
            minScreen = window.innerWidth > 400;
        
        if (!SidebarView.hasSearched && !exists) {
          SidebarView.addCompare(data);  
        }

        setTimeout(function() {
          $(parent).removeClass('hidden');
        }.bind(this), 200);
        
        if (((minScreen && orientation) || (self.sectionAmt <= 2)) || !Detection.isMobile) {
          self.drawGraph(data.bubbleArray, element);
        } else {
          $(parent + ' .mobile-graph').removeClass('hidden');
        }
      });

      $('.load-container').hide();
    },
    drawGraph: function(data, element) {
      $(element).empty();
      var width = $(element).width();
      var height = $(element).height();
      var self = this,
          small = 12,
          large = 30,
          domainSmall = 4,
          domainLarge = 28;
      if (Detection.isMobile) {
        if (width < 325) {
          small = 10;
          large = 26;
          domainSmall = 6;
          domainLarge = 60;
          var percentage = Math.round(data.length * 0.75);
          data = data.slice(percentage, data.length);
        } else if ((width < 800) && (width > 325)) {
          domainSmall = 6;
          domainLarge = 60;
          var percentage = Math.round(data.length * 0.5);
          data = data.slice(percentage, data.length);
        }
      } else {
        if ((width < 325) || (height < 325)) {
          small = 10;
          large = 26;
         var percentage = Math.round(data.length * 0.75);
         data = data.slice(percentage, data.length);
        } else if (((width < 600) && (width > 325)) || ((height < 600) && (height > 325))) {
          small = 14;
          large = 36;
          var percentage = Math.round(data.length * 0.5);
          data = data.slice(percentage, data.length);
        } else if ((width > 600) || (height > 600)) {
          small = 18;
          large = 66;
        } 
      }

      var size = d3.scale.linear().domain([domainSmall, domainLarge]).range([small, large]);

      var color = d3.scale.linear().domain([1,3,5]).range(["#e76a2a", "#f1df33","#55bc81"]);

      var colorBorder = d3.scale.linear().domain([1,3,5]).range(["#b06029", "#b3a740","#338e66"]);

      var textSize = d3.scale.linear().domain([10,14]).range([12,30]);

      // Tooltip
      var tip = d3Tip()
        .attr('class', 'd3-tip').offset([-8, 0])
        .html(function(d) {
            return "<span class='tipWord' style='color:" + color(d[2]) + "'>" + d[0] + "</span><p class='tipText tipText1'>average <span class='tipHeavy' style='color:" + color(d[2]) + "'>" + d[2].toFixed(1) + "</span></p><p class='tipText'>mentions <span class='tipHeavy' style='color:" + color(d[2]) + "'>" + d[1] + "</span></p>";
        });

      var tip2 = d3Tip()
        .attr('class', 'd3-tip2').offset(function(d) {
          return [size(d[1] * 2) + 108, 0];
        })
        .html(function(d) {
            return "<span class='tipWord' style='color:" + color(d[2]) + "'>" + d[0] + "</span><p class='tipText tipText1'>average <span class='tipHeavy' style='color:" + color(d[2]) + "'>" + d[2].toFixed(1) + "</span></p><p class='tipText'>mentions <span class='tipHeavy' style='color:" + color(d[2]) + "'>" + d[1] + "</span></p>";
        });

      // Set force
      var force = d3.layout.force()
          .nodes(data)
            .gravity(0.9)
              .charge(function(d) { return - size(d[1]) * size(d[1]) / 0.5;})
              .friction(0.4)
              .size([width, height])
              .on("tick", tick);

      var svg = d3.select(element).append("svg").attr("width", width).attr("height", height);

      svg.call(tip);
      svg.call(tip2);

      var node = svg.selectAll(".node").data(data, function(d) { return d;})
                .enter().append('g')
                  .on("click", function(d) {
                    if (Detection.isMobile) {
                      this.parentNode.appendChild(this);
                      d3.selectAll('.node')
                        .filter(function(b,i) { return b[0] === d[0];})
                          .classed({'border': true});
                      d3.selectAll('.node')
                        .filter(function(b,i) { return b[0] != d[0];})
                          .classed({'border': false});
                      d3.select(this)
                        .classed({'border': true});
                      if ( (d.y - size(d[1])) < 100 ) {
                        tip2.show(d);
                      }
                      else {
                        tip.show(d);
                      }
                    } else {
                      var num = this.parentNode.parentNode.parentNode.attributes[1].value,
                          model = self.model.itemAt(num),
                          obj = model.toObject(),
                          term = d[0];

                      router.exec('/analyze?appId=' + obj.appId + '&country=' + obj.country, null, {'term': term});
                    }
                  }).on('mouseover', function(d) {
                        this.parentNode.appendChild(this);
                        d3.selectAll('.node')
                          .filter(function(b,i) { return b[0] === d[0];})
                            .classed({'border': true});
                        d3.selectAll('.node')
                          .filter(function(b,i) { return b[0] != d[0];})
                            .classed({'border': false});
                        d3.select(this)
                          .classed({'border': true});
                        if ( (d.y - size(d[1])) < 100 ) {
                          tip2.show(d);
                        }
                        else {
                          tip.show(d);
                        }
            }).on('mouseout', function(d) {
              d3.selectAll('.node').classed({'border': false});
              tip.hide(d);
              tip2.hide(d);
            });

          var circles = node.append("circle")
                      .attr("r", function(d) { return size(d[1]);})
                      .attr('class','node')
              .attr("cy", function(d) { return d.y = height - ((d[2] - 1) * height / 4); })
                      .style('fill',function(d) {return color(d[2]);})
                      .style('stroke',function(d) {return colorBorder(d[2]);});

          force.start();

      function tick(d) {
        r = 45;
          circles.attr("cx", function(d) { return d.x = Math.max(r/2, Math.min(width - r/2, d.x)); })
            .attr("cy", function(d) { return d.y = Math.max(r/2, Math.min(height - r/2, d.y)); });
      }
    },
    setSectionAmt: function() {
      var url = window.location.href.match(/[?&]appId=([^&#]+)/),
          apps = url[1].split(/\s*,\s*/),
          length = apps.length;

      this.sectionAmt = length;

      $('.view-interior').attr('data-sections', length);
    }
  });

  return CompareView;
});