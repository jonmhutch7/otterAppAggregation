define(function(require) {
  var BaseView = require('./BaseView'),
      Collection = require('lavaca/mvc/Collection'),
      SidebarView = require('app/ui/views/controls/SidebarView'),
      Detection = require('lavaca/env/Detection'),
      router = require('lavaca/mvc/Router');
  require('rdust!templates/analyze');
  /**
   * Analyze view type
   * @class app.ui.views.AnalyzeView
   * @extends app.ui.views.BaseView
   */

  var AnalyzeView = BaseView.extend(function() {
      BaseView.apply(this, arguments);
      this.mapEvent({
        '.clear-filter': {
          tap: this.clearFilter.bind(this)
        },
        model: {
          'reset': this.reset.bind(this)
        },
      });

    }, {
    /**
     * The name of the template used by the view
     * @property {String} template
     * @default 'home'
     */
    template: 'templates/analyze',
    /**
     * A class name added to the view container
     * @property {String} className
     * @default 'analyze'
     */
    className: 'analyze',
    filterTerm: undefined,
    onRenderSuccess: function() {
      BaseView.prototype.onRenderSuccess.apply(this, arguments);

      SidebarView.configure('analyze');

      var model = this.model.toObject();

      if (model.items) {
        setTimeout(function() {
          $('.review-count').text('Last ' + model.items.reviews.length + ' Reviews');
          this.drawGraph(model.items.bubbleArray);
        }.bind(this), 200);
      }
    },

    reset: function() {
      var self = this;
      this.redraw().then(function() {
        $('.review-count').text('Last ' + this.model.get('items').reviews.length + ' Reviews');
        self.drawGraph(this.model.get('items').bubbleArray);
      });
    },

    filterReviews: function(node) {
      var viewModel = this.model.toObject(),
          reviews = new Collection(viewModel.items.reviews),
          term = node[0],
          filtered = [];

      reviews.each(function(index, model) {
        var str = model.get('content').label + model.get('title').label,
            newString = str.toLowerCase(),
            removePunctuation = newString.replace(/[^a-zA-Z'\w]/g,' '),
            split = removePunctuation.split(" ");

        var n = split.indexOf(term);

        if (n !== -1) {
          filtered.push(model.toObject());
        }

      });

      var object = {'items': { "reviews": filtered}};

      this.redraw('#reviews', object).then(function() {
        var src_str = $('#reviews').html();
        var res = src_str.replace(new RegExp('(\\b' + term + '\\b)', 'gi'), '<span class="highlight">$1</span>');

        $('#reviews').html(res);
        $('.review-count').text(filtered.length + ' reviews containting "' + term + '"');
        $('.clear-filter').show();
      });

    },
    clearFilter: function() {
      var model = this.model.toObject();

      this.redraw('#reviews', this.model);

      d3.selectAll('.node').classed({'border': false});

      $('.clear-filter').hide();
      $('.review-count').text('Last ' + model.items.reviews.length + ' Reviews');
    },
    drawGraph: function(data) {
      $('.d3-tip, .d3-tip2').remove();

      var width = $('#chart').width(),
          height = $('#chart').height(),
          self = this,
          small = 20,
          large = 45;

      if (width <= 350) {
        small = 15;
        large = 25;
        var percentage = Math.round(data.length * 0.75);
        data = data.slice(percentage, data.length);
      } else if ((width < 650) && (width > 350)) {
        small = 14;
        large = 36;
        var percentage = Math.round(data.length * 0.5);
        data = data.slice(percentage, data.length);
      } else if (width > 650) {
        small = 18;
        large = 66;
      } 

      var size = d3.scale.linear().domain([4,28]).range([small, large]);

      var color = d3.scale.linear().domain([1,3,5]).range(["#e76a2a", "#f1df33","#55bc81"]);

      var colorBorder = d3.scale.linear().domain([1,3,5]).range(["#b06029", "#b3a740","#338e66"]);

      // Tooltip
      var tip = d3Tip()
        .attr('class', 'd3-tip')
        .offset([-8, 0])
        .html(function(d) {
            return "<span class='tipWord' style='color:" + color(d[2]) + "'>" + d[0] + "</span><p class='tipText tipText1'>average <span class='tipHeavy' style='color:" + color(d[2]) + "'>" + d[2].toFixed(1) + "</span></p><p class='tipText'>mentions <span class='tipHeavy' style='color:" + color(d[2]) + "'>" + d[1] + "</span></p>";
        });

      var tip2 = d3Tip()
        .attr('class', 'd3-tip2')
        .offset(function(d) {
          return [size(d[1] * 2) + 108, 0];
        })
        .html(function(d) {
            return "<span class='tipWord' style='color:" + color(d[2]) + "'>" + d[0] + "</span><p class='tipText tipText1'>average <span class='tipHeavy' style='color:" + color(d[2]) + "'>" + d[2].toFixed(1) + "</span></p><p class='tipText'>mentions <span class='tipHeavy' style='color:" + color(d[2]) + "'>" + d[1] + "</span></p>";
        });

      // Set force
      var force = d3.layout.force()
          .nodes(data)
            .gravity(0.9)
              .charge(function(d) { return - size(d[1]) * size(d[1]) / 0.46;})
              .friction(0.4)
              .size([width, height])
              .on("tick", tick);

      var svg = d3.select("#chart").append("svg").attr("width", width).attr("height", height);

      svg.call(tip);
      svg.call(tip2);

      var node = svg.selectAll(".node")
                .data(data, function(d) { return d;})
                .enter().append('g')
                .on("click", function(d) {
                  if (Detection.isMobile) {
                    self.filterReviews(d);
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
                    d3.selectAll('g').classed({'clickBorder': false});
                    d3.select(this).classed({'clickBorder': true});
                    self.filterReviews(d);
                  }
                }).on('mouseover', function(d) {
                  if (!Detection.isMobile) {
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

          var text = node.append("text").attr('dy',4).attr('class','nodeText').text(function(d) {return d[0];});
            

          force.start();

          $('.load-container').hide();
          
          var term = this.model.get('term');

          if (term) {
            setTimeout(function() {
              var nodes = circles.data();
              for (var i = 0; i < nodes.length; i++) {
                if (nodes[i][0] === term) {
                  var d = nodes[i];
                  var t = d3.selectAll('.node').filter(function(b,i) { 
                    return b[0] === d[0];
                  });
                  d3.selectAll('.node')
                    .filter(function(b,i) { return b[0] === d[0];})
                      .classed({'border': true});
                  d3.selectAll('.node')
                    .filter(function(b,i) { return b[0] != d[0];})
                      .classed({'border': false});
                  d3.select(t[0][0]).classed({'clickBorder': true});
                  if ( (d.y - size(d[1])) < 100 ) {
                    tip2.show(d, t[0][0]);
                  } else {
                    tip.show(d, t[0][0]);
                  }
                  this.filterReviews({0: term});
                }
              }
            }.bind(this), 600);
          }
          
        function tick(d) {
          var r = 45;
          circles.attr("cx", function(d) { return d.x = Math.max(r/2, Math.min(width - r/2, d.x)); })
            .attr("cy", function(d) { return d.y = Math.max(r/2, Math.min(height - r/2, d.y)); });
          text.attr("x", function(d) { return d.x = Math.max(r/2, Math.min(width - r/2, d.x)); })
              .attr("y", function(d) { return d.y = Math.max(r/2, Math.min(height - r/2, d.y)); });
        }
    }
  });
  return AnalyzeView;
});