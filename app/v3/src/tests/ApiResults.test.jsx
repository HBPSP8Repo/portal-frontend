// tslint:disable:no-console

import ExperimentListContainer from "../containers/Experiments/ExperimentListContainer";
import ModelContainer from "../containers/Models/ModelContainer";
import { methods, models } from "../tests/mocks";
// import { IExperimentResultParsed, IModelResult } from "../types";

/// TESTS ///

/*
    Expected results:
      type: regression, classification
      format: application/highcharts+json, image/svg+xml, application/vnd.plotly.v1+json, application/vnd.dataresource+json, application/vnd.visjs+javascript,
    text/plain, text/html, text/plain+error

*/

const highcharts = data => {
  data.forEach(d => {
    expect(d.xAxis).toBeDefined();
  });

  return data;
};

const plotly = data => {
  data.forEach(d => {
    if (d.type && d.type === "heatmap") {
      expect(d.x).toBeDefined();
    } else {
      expect(d.data).toBeDefined();
    }
  });

  return data;
};
interface IPfa {
  crossValidation?: IValidationScore | IPolynomialClassificationScore;
  data?: any;
  remoteValidations?: INode | IValidationScore | IPolynomialClassificationScore;
  error?: any;
}

const pfa = (data: any): IPfa => {
  const output: IPfa = {};

  const accuracyKey = "Accuracy";
  const f1scoreKey = "Weighted F1-score";
  const falsePositiveRateKey = "Weighted false positive rate";
  const precisionKey = "Weighted precision";
  const recallKey = "Weighted recall";
  const confusionMatrixKey = "Confusion matrix";

  data.forEach(d => {
    if (!d.cells) {
      expect(d).toBeDefined();
      output.error = "WARNING, not handled";
      // output.data.push(d);
    } else {
      expect(d.cells).toBeDefined();

      if (d.cells.validations) {
        expect(d.cells.validations.init).toBeDefined();

        // Convert to array to have consistent results
        const init = d.cells.validations.init.length
          ? d.cells.validations.init
          : [d.cells.validations.init];

        const buildValidation = (dta: any, node: any) => {
          expect(dta[accuracyKey]).toBeDefined();
          expect(dta[confusionMatrixKey]).toBeDefined();
          expect(dta[f1scoreKey]).toBeDefined();
          expect(dta[falsePositiveRateKey]).toBeDefined();
          expect(dta[precisionKey]).toBeDefined();
          expect(dta[recallKey]).toBeDefined();
          expect(dta[falsePositiveRateKey]).toBeDefined();

          return {
            accuracy: parseFloat(dta[accuracyKey]),
            confusionMatrix: dta[confusionMatrixKey],
            f1score: parseFloat(dta[f1scoreKey]),
            falsePositiveRate: parseFloat(dta[falsePositiveRateKey]),
            node: `${node}`,
            precision: parseFloat(dta[precisionKey]),
            recall: parseFloat(dta[recallKey])
          };
        };

        init.forEach((i: any) => {
          expect(i.code).toBeDefined();
          expect(i.node).toBeDefined();

          if (i.error) {
            expect(i.error).toBeDefined();
            output.error += i.error;
            // console.log("\thas error");
            return;
          } else {
            expect(i.data).toBeDefined();

            const node = i.node;
            if (i.code === "kfold") {
              const dta: any = i.data.average;
              expect(dta).toBeDefined();
              output.crossValidation = buildValidation(dta, node);
            }

            if (i.code === "remote-validation") {
              const dta: any = i.data;
              expect(dta).toBeDefined();
              output.remoteValidations = buildValidation(dta, node);
            }
          }
        });
      }
    }
  });
  return output;
};

const jsonTest = data => {
  data.forEach(d => {
    expect(d).toBeDefined();
  });
  return data;
};

const errorTest = (data, error) => {
  let errorOutput;
  if (data) {
    expect(data.error).toBeDefined();
    errorOutput = data.error;
  } else {
    expect(error).toBeDefined();
    errorOutput = error;
  }

  return errorOutput.slice(-144);
  // console.log("\thas error");
};

const parse = value => {
  try {
    const json = JSON.parse(value);
    return json;
  } catch (e) {
    console.log("ERROR while parsing", e);
  }
};

test("Fetch experiments", async () => {
  const experimentListContainer = new ExperimentListContainer();

  await experimentListContainer.load();
  const experiments: IExperimentResult | undefined =
    experimentListContainer.state.experiments;
  expect(experiments).toBeDefined();

  let experimentResults: IExperimentResultParsed[] = [];
  experiments.slice(0, 100).forEach((experiment, index) => {
    console.log(JSON.stringify(experiment, null, 2));

    expect(experiment.created).toBeDefined();
    expect(experiment.hasError).toBeFalsy();
    expect(experiment.name).toBeDefined();
    expect(experiment.uuid).toBeDefined();
    expect(experiment.resultsViewed).toBeDefined();
    expect(experiment.user).toBeDefined();
    expect(experiment.algorithms).toBeDefined();

    if (!experiment.model) {
      return;
    }

    expect(experiment.model.slug).toBeDefined();
    console.log(
      index,
      "Experiment:",
      experiment.name,
      `${experiment.model.slug}/${experiment.uuid}`
    );

    if (experiment.hasServerError) {
      // console.log("hasServerError");
      expect(experiment.result).toBeDefined();
      return;
    }

    if (!experiment.result) {
      // console.log("No result");
      expect(experiment.finished).toBeNull();
      return;
    }

    expect(experiment.finished).toBeDefined();
    const algo = parse(experiment.algorithms);
    const names = algo.map(a => a.name);
    expect(names).toBeDefined();
    const codes = algo.map(a => a.code);
    expect(codes).toBeDefined();

    if (
      codes.includes("PIPELINE_ISOUP_MODEL_TREE_SERIALIZER") ||
      codes.includes("WP_LINEAR_REGRESSION")
    ) {
      // console.log("\tExareme format, not parsing yet");
      return;
    }

    const result = parse(experiment.result);
    const nodes: INode[] = [];
    result.forEach((r, i) => {
      const mime = r.type;

      let method: IMethod = {
        algorithm: r.algorithm,
        mime
      };
      console.log("\tname: ", names[i], ", mime:", mime);
      expect(mime).toBeDefined();

      expect(r.node).toBeDefined();

      // Convert to array to have consistent results
      const normalizedResult = input =>
        (input.data && (input.data.length ? input.data : [input.data])) || null;

      const results = normalizedResult(r);
      switch (mime) {
        case "application/vnd.highcharts+json":
          method.data = highcharts(results);
          break;

        case "application/vnd.plotly.v1+json":
          method.data = plotly(results);
          break;

        case "application/pfa+json":
          method = {
            ...method,
            ...pfa(results)
          };
          break;

        case "application/vnd.hbp.mip.experiment.pfa+json":
          results.forEach(aResult => {
            let subResult = aResult;

            // Lift the data one level up if needed
            if (!subResult.type && aResult.data) {
              subResult = normalizedResult(aResult);
            }
            expect(subResult.type).toBeDefined();
            expect(subResult.algorithm).toBeDefined();
            console.log(subResult.type);
            method.mime = subResult.type;
            method.algorithm = subResult.algorithm;

            switch (subResult.type) {
              case "application/vnd.highcharts+json":
                expect(subResult.data).toBeDefined();
                method.data = highcharts(normalizedResult(subResult));
                break;

              case "application/json":
                method.data = jsonTest(normalizedResult(subResult));
                break;

              case "text/plain+error":
                method.error = errorTest(subResult);
                break;

              case "application/vnd.plotly.v1+json":
                console.log("application/vnd.plotly.v1+json");
                break;

              case "application/pfa+json":
                method = {
                  ...method,
                  ...pfa(normalizedResult(subResult))
                };
                break;

              default:
                console.log("!!!!!!!! SHOULD TEST", subResult.type);
            }
          });

        case "application/json":
          method.data = jsonTest(results);
          break;

        // case "application/vnd.dataresource+json":
        //   break;

        // case "application/vnd.visjs+javascript":
        // break;

        case "text/plain+error":
          method.error = errorTest(results, r.error);
          break;

        default:
          console.log("!!!!!!!! SHOULD TEST", mime);
      }
    });
  });

  // console.log(experimentResults);
  console.log(JSON.stringify(experimentResults, null, 2));
});
