angular.module('chuvApp.experiments')
  .controller('NewExperimentController',
    [
      '$scope',
      'MLUtils',
      '$stateParams',
      'Model',
      '$location',
      '$modal',
      'notifications',
      function(
        $scope,
        MLUtils,
        $stateParams,
        Model,
        $location,
        $modal,
        notifications
      ) {
        $scope.loaded = false;
        $scope.parseInt = parseInt;

        $scope.ml_methods = [];
        $scope.shared = {
          chosen_method: null,
          method_parameters: [],
          cross_validation: false,
          experiment_configuration: []
        };
        $scope.help_is_open = true;

        $scope.type_name = function (method_name) {
          return method_name.charAt(0).toUpperCase() + method_name.slice(1) + "s";
        };

        // Get all the ml methods
        MLUtils.list_ml_methods().$promise.then(
          function (data) {
            $scope.ml_methods = data;

            // TODO Quick and dirty fix!
            // TODO to be added in the backend instead
            var exareme = $scope.ml_methods.filter(function(m){return m.code === "glm_exareme"});
            if (exareme.length > 0) {
              exareme[0].disable = true;
            }

            var tSNE = $scope.ml_methods.filter(function(m){return m.code === "tSNE"});
            if (tSNE.length > 0) {
              tSNE[0].disable = true;
            }

          }
        );

        // Check if the method can be applied to the model
        function available_method (method) {

          if (method.disable) {
            return false;
          }

          // Check constraints
          if (method.constraints) {

            // Output constraints
            if (method.constraints.variable) {
              if (!method.constraints.variable[$scope.predicting_type]) {
                return false;
              }
            }

            // Covariable constraints
            var cov_nb = $scope.dataset.header.length;
            var grp_nb = $scope.dataset.grouping.length;

            if (method.constraints.covariables) {
              if (method.constraints.covariables.min_count && cov_nb < method.constraints.covariables.min_count) {
                return false;
              }

              if (method.constraints.covariables.max_count && cov_nb > method.constraints.covariables.max_count) {
                return false;
              }
            }

            // Grouping constraints
            if (method.constraints.grouping) {
              if (method.constraints.grouping.min_count && grp_nb < method.constraints.grouping.min_count) {
                return false;
              }

              if (method.constraints.grouping.max_count && grp_nb > method.constraints.grouping.max_count) {
                return false;
              }
            }

            if (grp_nb > 0 && cov_nb > 0 && !method.constraints.mixed) {
              return false;
            }
          }

          return true;
        }

        // function to be called when query and dataset are ready
        function on_data_loaded () {

          $scope.loaded = true;

          var variable_data = $scope.dataset.data[$scope.dataset.variable[0]];

          $scope.predicting_type = MLUtils.get_datatype($scope.dataset.variable[0], variable_data);

          $scope.ml_methods.forEach(function(method) {
            method.available = available_method(method);
          });

          // Open methods menu accordion
          $scope.accordion = {
            statistics: true,
            features_extraction: true,
            predictive_model: true
          };
        }

        if ($stateParams.model_slug) {
          // we have a slug: load model
          Model.get({slug: $stateParams.model_slug}, function(result) {
            $scope.model = result;
            $scope.dataset = result.dataset;
            $scope.query = result.query;
            on_data_loaded();
          });

          $scope.model_slug = $stateParams.model_slug;

        } else {

          // load model from data

          // step 1: load query
          var search = $location.search();
          function map_query(category) {
            return search[category]
              ? search[category].split(",").map(function (code) { return {code: code}})
              : [];
          }

          $scope.query = {
            variables: map_query("variables"),
            groupings: map_query("groupings"),
            coVariables: map_query("coVariables"),
            filters: map_query("filters"),
            textQuery: search.query
          };

          // step 2: load dataset
          var query = angular.copy($scope.query);

          Model.executeQuery(query).success(function (queryResult) {
            $scope.loading_model = false;
            $scope.dataset = queryResult;
            on_data_loaded();
          });

          $scope.save_model = function (callback) {
            // pass

            $modal.open({
              templateUrl: "/scripts/app/experiments/save-model-modal.html",
              controller: ['$scope', '$state', function (child_scope, $state) {
                child_scope.do_save_model = function() {

                  $scope.model = {
                    title: child_scope.name,
                    config: {
                      type: 'designmatrix',
                      height: 480,
                      yAxisVariables: $scope.dataset.header.slice(0, 5),
                      xAxisVariable: null,
                      title: {text: child_scope.name }
                    },
                    dataset: $scope.dataset,
                    valid: child_scope.share,
                    query: $scope.query
                  };

                  // save new model
                  Model.save($scope.model, function (result) {
                    $scope.model = result;
                    $scope.dataset = result.dataset;
                    $scope.query = result.query;
                    notifications.success("The model was successfully saved!");
                    child_scope.$close();
                  }, function(){
                    // TODO Add a notification service...
                    notifications.error("An error occurred when trying to save the model!");
                    child_scope.$dismiss();
                  });
                };
              }]
            })
          }
        }

        /**
         * Checks whether this method has already been added to the experiment with this
         * set of parameters.
         * @returns {boolean}
         */
        $scope.method_already_configured = function () {
          var method_idx, chosen_parameter_idx, other_parameter_idx, method;

          return _.any(
            $scope.shared.experiment_configuration,
            function (method) {

              return method.code == $scope.shared.chosen_method.code && _.all(
                  $scope.shared.method_parameters,
                  function (chosen_parameter) {

                    return _.any(
                      method.parameters,
                      function (other_parameter) {

                        return other_parameter.code == chosen_parameter.code && chosen_parameter.value == other_parameter.value

                      }
                    )
                  }
                )
            }
          )
        };

        /**
         * Returns whether the current configuration is valid
         * @returns {boolean}
         */
        $scope.configuration_not_valid = function() {
          var chosen_parameter_idx;

          for (chosen_parameter_idx = 0; chosen_parameter_idx < $scope.shared.method_parameters.length; chosen_parameter_idx++) {
            if (!$scope.shared.method_parameters[chosen_parameter_idx].value) {
              return true;
            }
          }

          return false;
        };

        $scope.add_to_experiment = function () {

          var name = $scope.shared.chosen_method.label;
          if ($scope.shared.method_parameters && $scope.shared.method_parameters.length) {
            name += " with " + $scope.shared.method_parameters.map(function (parameter, index) {
                return parameter.label
                  + '='
                  + parameter.value
                  + (index !== $scope.shared.method_parameters.length - 1 ? ", " : "");
              });
          }

          var is_predictive_model = $scope.shared.chosen_method.type.indexOf("predictive_model") >= 0;

          var method_to_be_added = {
            code: $scope.shared.chosen_method.code,
            name: name,
            validation: is_predictive_model,
            parameters: $scope.shared.method_parameters.map(function (param) { return { code: param.code, value: param.value }})
          };

          $scope.shared.experiment_configuration.push(method_to_be_added);
          $scope.shared.cross_validation |= is_predictive_model;
        };

        $scope.remove_from_experiment = function (index) {

          // If we remove a predictive model, check that we still require a validation
          if ($scope.shared.experiment_configuration[index].validation) {
            var predictive_models = $scope.shared.experiment_configuration.filter(function (m) { return m.validation });
            $scope.shared.cross_validation = !!(predictive_models.length - 1);
          }

          $scope.shared.experiment_configuration.splice(index, 1)
        };
      }])
  .controller('ExperimentDetailsController', ['$stateParams', '$state', 'MLUtils', '$scope', '$timeout', 'User', function ($stateParams, $state, MLUtils, $scope, $timeout, User) {

    var refresh_rate = 10000; // ms
    var cancel_timeout;
    var cancelled = false;
    var is_waiting_for_finish = false;
    $scope.loading = true;
    $scope.model_slug = $stateParams.model_slug;

    $scope.get_display_type = MLUtils.get_display_type;

    function refresh_experiment_until_done () {
      if (!cancelled && !$scope.experiment.finished) {
        is_waiting_for_finish = true;
        cancel_timeout = $timeout(refresh_experiment_until_done, refresh_rate);
        get_experiment();
      }
    }

    function compute_overview_graph(overview) {
      return {
        "options": {
          "chart": {
            "type": "column",
            "height": 250
          },
          "plotOptions": {
            "column": {}
          },
          "exporting": {"enabled": false},
          "tooltip": {
            headerFormat: "",
            pointFormat: "<span style=\"color:{point.color}\">\u25CF</span> {series.name}: <b>{point.y:.3f}</b><br/>"
          },
          "legend": {
            enabled: false
          }
        },
        "series": overview.data,
        "title": {
          "text": overview.label
        },
        "loading": false,
        "xAxis": {
          "categories": overview.methods,
          "labels": {
            "enabled": false
          },
          "tickLength": 0

        },
        "yAxis": {
          "title": {
            "text": null
          }
        }
      };
    }

    function link_charts_legend (chart) {
      chart.options.chart.events = {
        redraw: function () {
          $('.single-legend').empty();
          var chart = this;
          $(chart.series).each(function (i, serie) {
            $('<li style="color: ' + (serie.visible? serie.color  : 'grey') + '">' + serie.name + '</li>').click(function () {
              $('.overview-charts > div > div').each(function() {
                var series = $(this).highcharts().series[serie.index];
                if (series.visible) {
                  series.hide();
                } else {
                  series.show();
                }
              });
            }).appendTo('.single-legend');
          });
        }
      }
    }

    function get_experiment () {
      MLUtils.get_experiment($stateParams.experiment_uuid).then(
        function on_get_experiment_success (response) {
          if (cancelled) return;

          $scope.experiment = response.data;
          $scope.loading = false;

          // TODO Workaround while backend give us string instead of JSON objects...
          // TODO To be removed!
          $scope.experiment.validations = JSON.parse(response.data.validations);
          $scope.experiment.algorithms = JSON.parse(response.data.algorithms);
          $scope.experiment.results = JSON.parse(response.data.result);

          if (!is_waiting_for_finish)
            refresh_experiment_until_done();

          // Parse the results
          try {
            $scope.experiment.display = MLUtils.parse_results($scope.experiment.results);

            // Prepare charts
            $scope.overview_charts = $scope.experiment.display.overview.map(function (o) {
              return compute_overview_graph(o);
            });

            // Add legend
            if($scope.overview_charts.length) {
              link_charts_legend($scope.overview_charts[0]);
            }

          } catch (e) {
            throw e;
            if (!($scope.experiment.hasError || $scope.experiment.hasServerError)) {
              $scope.experiment.hasError = true;
              $scope.experiment.result = "Invalid JSON: \n" + $scope.experiment.result;
            }
          } finally {

            // Mark as read
            if (!$scope.experiment.resultsViewed) {
              MLUtils.mark_as_read($scope.experiment);
            }
          }
        },
        function on_get_experiment_fail (response) {

          if (cancelled) return;
          $scope.loading = false;
          $scope.experiment = {
            hasError: true,
            result: "This experiment doesn't exist"
          };
        }
      )
    }

    get_experiment();

    $scope.$on("$destroy", function () {
      if (cancel_timeout) {
        cancelled = true;
        $timeout.cancel(cancel_timeout);
      }
    });

    var user;
    $scope.sharing_working = false;
    User.get().then(function () { user = User.current(); });

    $scope.experiment_is_mine = function () {
      return $scope.experiment.createdBy.username === user.username;
    };

    $scope.mark_experiment_as_unshared = function () {
      $scope.sharing_working = true;
      MLUtils.mark_as_unshared($scope.experiment).then(function () {
        $scope.experiment.shared = false;
        $scope.sharing_working = false;
      }, function () {
        $scope.experiment.shared = true;
        $scope.sharing_working = false;
      });
    };
    $scope.mark_experiment_as_shared = function () {
      $scope.sharing_working = true;
      MLUtils.mark_as_shared($scope.experiment).then(function () {
        $scope.experiment.shared = true;
        $scope.sharing_working = false;
      }, function () {
        $scope.experiment.shared = false;
        $scope.sharing_working = false;
      });
    };
  }]);