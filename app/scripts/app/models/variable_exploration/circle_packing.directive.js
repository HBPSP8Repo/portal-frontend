"use strict";
angular.module("chuvApp.models").directive("circlePacking", [
  "$location",
  function($location) {
    return {
      templateUrl: "scripts/app/models/variable_exploration/circle_packing.html",
      replace: true,
      link: function($scope, element) {
        $scope.search_history = [];
        $scope.search = {};
        $scope.selectedDatasets = $location.search()["trainingDatasets"]
          ? $location.search()["trainingDatasets"].split(",")
          : [];
        $scope.populatedGroups = {}; // FIXME: bad scope
        var api = {};

        $scope.isDatasetSelected = function(code) {
          return $scope.selectedDatasets.includes(code);
        };

        var groups;
        var disableLastWatch = function() {};
        var group_dict;
        var color = d3.scale
          .linear()
          .domain([-1, 5])
          .range(["hsl(152,80%,80%)", "hsl(228,30%,40%)"])
          .interpolate(d3.interpolateHcl);
        var svg;

        function createCirclePackingDataStructure() {
          // all groups by code
          group_dict = {};

          function map_groups(group) {
            var description = group.label;
            if (group.description) {
              description += "\n" + group.description;
            }

            return (group_dict[group.code] = {
              label: group.label,
              code: group.code,
              is_group: true,
              original: group,
              description: description,
              children: group.groups.map(map_groups)
            });
          }

          // put groups in datastructure
          groups = map_groups($scope);

          // FIXME: add variables to the root node
          const root = {
            label: "Dataset",
            is_group: true,
            code: "root",
            original: { code: "root" },
            children: []
          };
          group_dict.root = root;
          groups.children.push(root);

          $scope.populatedGroups = groups;
          // and then all the variables in all the right groups
          $scope.allVariables.forEach(function(variable) {
            var group = group_dict[variable.group.code],
              description = variable.label;
            if (variable.description) {
              description += "\n" + variable.description;
            }
            if (!group) {
              return;
            }

            group.children.push(
              (group_dict[variable.code] = {
                code: variable.code,
                label: variable.label,
                is_group: false,
                datasets: variable.datasets,
                description: description,
                original: variable,
                children: []
              })
            );
          });
        }

        function applyNodeColors() {
          var circle = svg.selectAll("circle");
          circle.style("fill", color_for_node);
          Object.keys($scope.configuration).forEach(function(category) {
            circle.classed(category, function(node) {
              return (
                node.code && $scope.variable_is_used_as(category, node.code)
              );
            });
          });
        }

        // clears the current circle packing and recreates it from crash.
        // quite compute intensive, do not overuse.
        // used when resizing
        // inspired from: bl.ocks.org/mbostock/7607535
        function updateCirclePacking() {
          element.find(".panel-body").empty();
          disableLastWatch();

          var margin = 20,
            diameter = element.width(),
            root = groups,
            pack = d3.layout
              .pack()
              .padding(2)
              // prevent sorting, otherwise packing will look way too regular.
              //.sort(null)
              // disabled: sort by descending value for better packing
              .sort(function comparator(a, b) {
                return b.value - a.value;
              })
              .size([diameter - margin, diameter - margin])
              // circle weight is based on the length of text. It's not
              // strictly necessary but makes things nicer looking.
              .value(function(d) {
                return 2 + d.label.length;
              });
          svg = d3
            .select(element.find(".panel-body")[0])
            .append("svg")
            .on("click", function() {
              zoom(root);
            })
            .attr("width", diameter)
            .attr("height", diameter)
            .append("g")
            .attr(
              "transform",
              "translate(" + diameter / 2 + "," + diameter / 2 + ")"
            );

          //var wrap = d3.textwrap().bounds({ height: 480, width: 960 });
          var focus = groups,
            nodes = pack.nodes(groups),
            view,
            circle = svg
              .selectAll("circle")
              .data(nodes)
              .enter()
              .append("circle")
              .filter(function(d) {
                return !d.is_group || d.children;
              }) // Do not display enpty groups
              .attr("class", function(d) {
                return d.parent
                  ? d.children ? "node" : "node node--leaf"
                  : "node node--root";
              })
              .style("fill", color_for_node)
              .on("click", function(d) {
                if (focus !== d) {
                  zoom(d);
                }
                d3.event.stopPropagation();
              });

          var width = 260, height = 140;

          var text = svg
            .selectAll("foreignObject")
            .data(nodes)
            .enter()
            .append("foreignObject")
            .attr("width", width)
            .attr("height", height)
            .attr("x", -(width / 2))
            .attr("y", -(height / 2))
            .filter(function(d) {
              return !d.is_group || d.children;
            }) // Do not display enpty groups
            .attr("class", function(d) {
              return d.children
                ? "circle-label group"
                : "circle-label variable";
            })
            .style("display", function(d) {
              return d.parent === root ? "inline" : "none";
            })
            .append("xhtml:div")
            .attr("width", width)
            .attr("height", height)
            .append("xhtml:span")
            .html(function(d) {
              return d.label ? d.label.split(" ").join("<br>") : "";
            });

          var node = svg.selectAll("circle, foreignObject");

          circle
            .append("title")
            .text(function(d) {
              return d.description;
            })
            .transition();

          zoomTo([root.x, root.y, root.r * 2 + margin]);
          applyNodeColors();

          function zoom(d, calledFromAngular) {
            if (typeof d === "string") {
              var d = nodes.find(node => node.code === d);
            }
            focus = d;
            var transition = d3
              .transition()
              .duration(750)
              .tween("zoom", function(d) {
                return function(t) {
                  zoomTo(
                    d3.interpolateZoom(view, [
                      focus.x,
                      focus.y,
                      focus.r * 2 + margin
                    ])(t)
                  );
                };
              });

            var condition = function(d) {
              return d && (d.parent === focus || (!d.children && d === focus));
            };

            transition
              .selectAll("foreignObject")
              .filter(function(d) {
                return this.style.display === "inline" || condition(d);
              })
              .style("fill-opacity", function(d) {
                return condition(d) ? 1 : 0;
              })
              .each("start", function(d) {
                if (condition(d)) {
                  this.style.display = "inline";
                }
              })
              .each("end", function(d) {
                if (!condition(d)) {
                  this.style.display = "none";
                }
              });

            // this happens when a circle is clicked: bind the variable
            // and notify angular, since the event doesn't happen within angular.
            if (
              !$scope.focused_variable ||
              $scope.focused_variable.code !== d.original.code
            ) {
              var variable = d.is_group
                ? Object.assign({ is_group: true }, d.original)
                : d.original;

              $scope.set_focused_variable(variable);
              $scope.search.value = null;
              $scope.search.group = null;
              if (!calledFromAngular) $scope.$apply(); //$apply trigger a digest cycle, necessary for a click on a svg el
            }
          }

          function zoomTo(v) {
            var k = diameter / v[2];
            view = v;
            node.attr("transform", function(d) {
              return (
                "translate(" + (d.x - v[0]) * k + "," + (d.y - v[1]) * k + ")"
              );
            });
            circle.attr("r", function(d) {
              return d.r * k;
            });
          }

          d3.select(self.frameElement).style("height", diameter + "px");

          disableLastWatch = $scope.$watch("focused_variable", function(
            variable
          ) {
            if (variable && variable.code && group_dict[variable.code]) {
              zoom(group_dict[variable.code]);
            }
          });

          $scope.$watch("search.group", function(code) {
            if (!code) {
              return;
            }

            var groupNode = nodes.find(function(node) {
              return node.code === code;
            });

            if (!groupNode) {
              return;
            }
            zoom(groupNode);
          });

          zoom(groups, true);

          return { zoom: d => zoom(d, true) };
        }

        function color_for_node(node) {
          var category = _.find(Object.keys($scope.configuration), function(
            category
          ) {
            return node.code && $scope.variable_is_used_as(category, node.code);
          });
          if (category) {
            return null;
          }
          return node.children ? color(node.depth) : null;
        }

        $scope.$on("configurationChanged", applyNodeColors);

        // update circle packing whenever groups change
        // (won't happen often)
        $scope.$watch("groups", function(groups) {
          if (groups != null) {
            createCirclePackingDataStructure();
            var api = updateCirclePacking();
            $scope.zoom = api.zoom;
          }
        });

        //redraw the whole stuff when resizing.
        //every circle changes size and position, so I might as well...
        var prev_dimension = element.width();

        function resize_handler() {
          if ($scope.groups != null && element.width !== prev_dimension) {
            prev_dimension = element.width();

            api = updateCirclePacking();
            $scope.zoom = api.zoom;
          }
        }
        angular.element(window).bind("resize", resize_handler);
        $scope.$on("$destroy", function() {
          angular.element(window).unbind("resize", resize_handler);
        });

        $scope.$watch("search.value", function(variable) {
          if (variable && variable.code && group_dict[variable.code]) {
            $scope.set_focused_variable(variable);

            if ($scope.search_history.indexOf(variable) < 0) {
              $scope.search_history.unshift(variable);
              if ($scope.search_history.length > 5) {
                $scope.search_history.pop();
              }
            }
          }
        });

        $scope.setDataset = function(code) {
          if (!code) return;

          if ($scope.selectedDatasets.includes(code)) {
            $scope.selectedDatasets.splice(
              $scope.selectedDatasets.indexOf(code),
              1
            );
          } else {
            $scope.selectedDatasets.push(code);
          }

          const selectedDatasetsObj = {};
          $scope.selectedDatasets.forEach(
            datasetName => selectedDatasetsObj[datasetName] = {}
          );
          $scope.configuration["trainingDatasets"] = selectedDatasetsObj;

          // TODO
          // svg
          //   .selectAll("circle")
          //   .style("opacity", 1)
          //   .filter(function(data) {
          //     return (
          //       !data.is_group &&
          //       !$scope.selectedDatasets
          //         .map(function(d) {
          //           return data.datasets.includes(d);
          //         })
          //         .every(function(op) {
          //           return op;
          //         })
          //     );
          //   })
          //   .style("opacity", 0.2);
        };

        $scope.$on("event:setToURLtrainingDatasets", function(event, data) {
          data.map(function(curVal) {
            return $scope.selectedDatasets.push(curVal.code);
          });
        });
      }
    };
  }
]);
