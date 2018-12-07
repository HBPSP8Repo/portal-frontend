import * as React from "react";
import {
  Checkbox,
  FormGroup,
} from "react-bootstrap";

enum DatasetType {
  Training,
  Validation,
  Test
}

const handleChangeDataset = (
  query: any,
  datasets: any,
  code: string,
  type: DatasetType,
  handleUpdateQuery: any
) => {
  if (query) {
    if (type === 0) {
      query.trainingDatasets = toggleDataset(datasets, code);

      if (
        getDatasetCheckedState(query.trainingDatasets, code) &&
        getDatasetCheckedState(query.validationDatasets, code)
      ) {
        query.validationDatasets = toggleDataset(
          query.validationDatasets,
          code
        );
      }
    } else if (type === 1) {
      query.validationDatasets = toggleDataset(datasets, code);

      if (
        getDatasetCheckedState(query.trainingDatasets, code) &&
        getDatasetCheckedState(query.validationDatasets, code)
      ) {
        query.trainingDatasets = toggleDataset(query.trainingDatasets, code);
      }
    }

    handleUpdateQuery(query);
  }
};

const getDatasetCheckedState = (selectedDatasets: any = [], code: any) => {
  if (
    selectedDatasets &&
    selectedDatasets.map((d: any) => d.code).indexOf(code) === -1
  ) {
    return false;
  }

  return true;
};

const toggleDataset = (datasets: any, code: any): any => {
  let newDataset = [];
  if (datasets) {
    if (datasets.map((d: any) => d.code).indexOf(code) > -1) {
      newDataset = [...datasets.filter((d: any) => d.code !== code)];
    } else {
      newDataset = [...datasets, { code }];
    }
  } else {
    newDataset = [{ code }];
  }

  return newDataset;
};

const Validation = ({
  isPredictiveMethod,
  datasets,
  query,
  handleUpdateQuery
}: {
  isPredictiveMethod: boolean;
  datasets: any;
  query: any;
  handleUpdateQuery: any;
}) => (
  <fieldset style={{ padding: "8px" }}>
    <h5>
      {isPredictiveMethod && <strong>Training and kfold</strong>}
      {!isPredictiveMethod && <strong>Datasets</strong>}
    </h5>

    <FormGroup>
      {datasets &&
        datasets.map((dataset: any) => {
          return (
            <Checkbox
              key={dataset.code}
              inline={true}
              // tslint:disable-next-line jsx-no-lambda
              onChange={event =>
                handleChangeDataset(
                  query,
                  query && query.trainingDatasets,
                  dataset.code,
                  DatasetType.Training,
                  handleUpdateQuery
                )
              }
              checked={getDatasetCheckedState(
                query && query.trainingDatasets,
                dataset.code
              )}
            >
              {dataset.label}
            </Checkbox>
          );
        })}
    </FormGroup>
    {isPredictiveMethod && (
      <div>
        <h5>
          <strong>Remote-validation</strong>
        </h5>
        <FormGroup>
          {datasets &&
            datasets.map((dataset: any) => {
              return (
                <Checkbox
                  key={dataset.code}
                  inline={true}
                  // tslint:disable-next-line jsx-no-lambda
                  onChange={event =>
                    handleChangeDataset(
                      query,
                      query && query.validationDatasets,
                      dataset.code,
                      DatasetType.Validation,
                      handleUpdateQuery
                    )
                  }
                  checked={getDatasetCheckedState(
                    query && query.validationDatasets,
                    dataset.code
                  )}
                >
                  {dataset.label}
                </Checkbox>
              );
            })}
        </FormGroup>
      </div>
    )}
  </fieldset>
);

export default Validation;