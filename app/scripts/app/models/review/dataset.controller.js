"use strict";

angular.module("chuvApp.models").controller("DatasetController", [
  "$scope",
  "$stateParams",
  "Model",
  "ChartUtil",
  "filterFilter",
  "Variable",
  "Group",
  "Config",
  "$rootScope",
  "$log",
  "$timeout",
  "$location",
  "$state",
  "$q",
  function(
    $scope,
    $stateParams,
    Model,
    ChartUtil,
    filterFilter,
    Variable,
    Group,
    Config,
    $rootScope,
    $log,
    $timeout,
    $location,
    $state,
    $q
  ) {
    $scope.loading = true;
    $scope.error = undefined;
    $scope.tableHeader = undefined;
    $scope.tableRows = undefined;

    $scope.histogramLoading = true;
    $scope.histogramError = undefined;
    $scope.histogramData = undefined;

    $scope.boxplotLoading = true;
    $scope.boxplotError = undefined;
    $scope.boxplotData = undefined;

    $scope.tsneLoading = true;
    $scope.tsneError = undefined;
    $scope.tsneData = undefined;

    // params key/values
    var search = $location.search();
    const map_query = category =>
      (search[category]
        ? search[category].split(",").map(code => ({ code }))
        : []);

    const encodeFilters = () => {
      return $scope.query.textQuery
        ? JSON.stringify($scope.query.filterQuery)
        : "";
    };

    $scope.query.variables = map_query("variable");
    $scope.query.groupings = map_query("grouping");
    $scope.query.coVariables = map_query("covariable");
    $scope.query.filters = map_query("filter");
    $scope.query.filterQuery = !_.isEmpty(search.filterQuery)
      ? JSON.parse(search.filterQuery)
      : null;
    $scope.query.trainingDatasets = map_query("trainingDatasets");

    let selectedVariables = [];
    let selectedDatasets = [...$scope.query.trainingDatasets.map(d => d.code)];

    const getDependantVariable = () =>
      (_.isUndefined($scope.query.variables[0])
        ? null
        : $scope.query.variables[0]);

    // Charts ressources
    const getStatistics = () => {
      $scope.loading = true;
      let rows = [];
      // format
      // const rows = [
      //   {
      //     code,
      //     variable: { label },
      //     parent: { code, label }
      //     datasets: [{ code, label }],
      //     continuous: [{ min, max, mean }],
      //     nominal: [[{ key, count }]]
      //     }
      // ];

      if (!selectedDatasets.length) {
        $scope.error = "Please, select at least a dataset.";
        return;
      } else {
        $scope.error = null;
      }

      // Get local or federation mode
      return (
        Config.then(config => config.mode === "local")
          // Forge queries for variable's getStatistics by dataset
          .then(isLocal =>
            $q.all(
              selectedDatasets.map(d =>
                Model.mining({
                  algorithm: {
                    code: isLocal ? "statisticsSummary" : "statisticsSummary", //"WP_VARIABLE_SUMMARY", FIXME once Exareme format is ready
                    name: isLocal ? "statisticsSummary" : "statisticsSummary", // "WP_VARIABLE_SUMMARY",
                    parameters: [],
                    validation: false
                  },
                  variables: $scope.query.variables,
                  grouping: $scope.query.groupings,
                  covariables: $scope.query.coVariables,
                  datasets: [{ code: d }],
                  filters: $scope.query.textQuery
                    ? JSON.stringify($scope.query.filterQuery)
                    : ""
                })
              )
            )
          )
          .then(response => response.map(r => r.data))
          .then(data => // flatten [[]]
            [].concat.apply([], data.map(d => d.data.data.map(e => e)))
          )
          .then(data => // all variables reduced by code field
            data.reduce((total, amount) => {
              const existing = total.find(a => a.index === amount.index);
              const isNominal = Object.keys(amount.count).length > 1;

              if (existing) {
                existing[isNominal ? "nominal" : "continuous"].push(amount);
              } else {
                const value = { index: amount.index };
                value[[isNominal ? "nominal" : "continuous"]] = [amount];
                total.push(value);
              }

              return total;
            }, [])
          )
          .then(data => {
            // Surcharge with variable data
            rows = data;
            return $q.all(data.map(d => Variable.getVariableData(d.index)));
          })
          .then(data =>
            rows.map((r, i) =>
              Object.assign({}, r, {
                parent: data[i].parent,
                variable: data[i].data,
                datasets: selectedDatasets
              })
            )
          )
          .then(data => {
            rows = data;

            $scope.tableHeader = ["Variables", ...selectedDatasets];
            $scope.tableRows = formatTable(data);
            $scope.loading = false;
            $scope.error = null;

            return data;
          })
          .catch(e => {
            $scope.loading = false;
            $scope.error = e;
            console.log(e);
          })
      );
    };

    // Format for angular
    const formatTable = data => {
      const tableRows = [];
      data.forEach((d, i) => {
        let row;

        if (
          i === 0 ||
          (d.parent && i > 0 && d.parent.code !== data[i - 1].parent.code)
        ) {
          row = {
            header: true,
            data: [d.parent.label, ...selectedDatasets.map(() => "")]
          };
          tableRows.push(row);
        }

        if (d.continuous) {
          row = {
            data: [
              d.variable.label,
              ...d.continuous.map(e => {
                const mean = (e.mean && parseFloat(e.mean).toFixed(2)) || 0;
                const min = (e.min && parseFloat(e.min).toFixed(2)) || 0;
                const max = (e.max && parseFloat(e.max).toFixed(2)) || 0;

                return `${mean} (${min}-${max})`;
              })
            ]
          };
          tableRows.push(row);
        } else {
          row = {
            data: [d.variable.label, ...selectedDatasets.map(() => "")]
          };
          tableRows.push(row);

          tableRows.push(
            ...Object.keys(d.nominal[0].count).map(k => ({
              sub: true,
              data: [k, ...d.nominal.map(e => e.count[k])]
            }))
          );
        }
      });

      return tableRows;
    };

    const getTSNE = () =>
      Model.mining({
        algorithm: {
          code: "tSNE",
          name: "tSNE",
          parameters: [],
          validation: false
        },
        variables: $scope.query.variables,
        grouping: $scope.query.groupings,
        coVariables: $scope.query.coVariables,
        // datasets: selectedDatasets,
        filters: ""
      })
        .then(result => {
          $scope.tsneLoading = false;
          $scope.tsneData = result;
        })
        .catch(e => {
          $scope.tsneError = e;
          $scope.tsneLoading = false;
        });

    const getHistogram = function() {
      if ($scope.histogramData) return;

      const variable = getDependantVariable();
      return variable
        ? Variable.get_histo(
            variable.code,
            selectedDatasets.map(code => ({ code })),
            $scope.query.textQuery
              ? JSON.stringify($scope.query.filterQuery)
              : ""
          ).then(
            function(response) {
              var data = response.data && response.data.data;
              if (!angular.isArray(data)) {
                data = [data];
              }
              $scope.histogramData = data.map(function(stat) {
                var series =
                  stat &&
                  stat.series &&
                  stat.series.length &&
                  stat.series[0].data;
                return {
                  stats: {
                    count: series && series.length,
                    min: 0,
                    max: 1,
                    av: series.reduce(function(a, b) {
                      return a + b;
                    }) / series.length
                  },
                  chart: stat.chart,
                  xAxis: stat.xAxis,
                  yAxis: stat.yAxis,
                  series: stat.series,
                  title: stat.title
                };
              });
              $scope.histogramLoading = false;
            },
            function(e) {
              $scope.histogramLoading = false;
              $scope.histogramError = e;
            }
          )
        : null;
    };

    const getBoxplot = data => {
      $scope.boxplotData = data.filter(f => f.continuous).map(d => ({
        chart: {
          type: "boxplot"
        },
        title: d.index,
        xAxis: {
          categories: d.datasets,
          title: null
        },
        yAxis: {
          title: null
        },
        series: [
          {
            name: d.variable.label,
            data: d.continuous.map(s => [
              s.min,
              s["25%"],
              s["50%"],
              s["75%"],
              s.max
            ]),
            index: 1,
            id: 1
          }
        ]
      }));
      $scope.boxplotLoading = false;
    };

    $scope.isSelected = function(variable) {
      return selectedVariables.includes(variable);
    };

    $scope.selectDataset = code => {
      if (selectedDatasets.includes(code)) {
        const index = selectedDatasets.indexOf(code);
        selectedDatasets.splice(index, 1);
      } else {
        selectedDatasets.push(code);
      }
      $location.search("trainingDatasets", selectedDatasets.join(","));

      getStatistics();
    };

    $scope.isDatasetSelected = code => {
      return selectedDatasets.includes(code);
    };

    $scope.open_experiment = function() {
      if ($scope.model && $scope.model.slug) {
        return $state.go("new_experiment", { model_slug: $scope.model.slug });
      }

      function unmap_category(category) {
        return $scope.query[category]
          .map(function(variable) {
            return variable.code;
          })
          .join(",");
      }

      var query = {
        variables: unmap_category("variables"),
        coVariables: unmap_category("coVariables"),
        groupings: unmap_category("groupings"),
        filters: unmap_category("filters"),
        filterQuery: JSON.stringify($scope.query.filterQuery),
        trainingDatasets: unmap_category("trainingDatasets"),
        graph_config: $scope.chartConfig,
        model_slug: ""
      };

      return $state.go("new_experiment", query);
    };

    // init
    const init = (model = {}) => {
      $scope
        .loadResources(model)
        .then(() =>
          Variable.datasets().then(data => {
            $scope.allDatasets = data;

            const variable = getDependantVariable();
            if (!variable) {
              $scope.error =
                "Please, select some variables in the previous screen.";
              return;
            }

            getStatistics().then(getBoxplot);
            getHistogram();

            // retrieve filterQuery as sql text, hack queryBuilder
            if ($scope.query.filterQuery) {
              const $element = $("<div>");
              const qb = $element.queryBuilder({
                rules: $scope.query.filterQuery,
                filters: $scope.getFilterVariables(),
                allow_empty: true,
                inputs_separator: " - "
              });

              $scope.query.textQuery = qb.queryBuilder(
                "getSQL",
                false,
                false
              ).sql;
              qb.queryBuilder("destroy");
            }
          })
        )
        .catch(console.log);
    };

    $scope.$on("event:configureFilterQueryFinished", () => {
      $location.search("filterQuery", JSON.stringify($scope.query.filterQuery));
      init();
    });

    $scope.$on("event:loadModel", function(evt, model) {
      selectedDatasets = [...$scope.query.trainingDatasets.map(d => d.code)];
      init(model);
    });

    if ($stateParams.slug === undefined) {
      init();
    }

    // comfortable export button close
    $scope.exportPannel = false;
    $scope.toogleExport = function() {
      $scope.exportPannel = !$scope.exportPannel;
    };
    let exportTimer;
    $scope.exportClose = function() {
      exportTimer = $timeout(() => {
        $scope.exportPannel = false;
      }, 1000);
    };
    $scope.exportCloseDeny = function() {
      $timeout.cancel(exportTimer);
    };
  }
]);
