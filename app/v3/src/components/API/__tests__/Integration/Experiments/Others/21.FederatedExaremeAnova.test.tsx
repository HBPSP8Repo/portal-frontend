import { mount } from 'enzyme';
import * as React from 'react';
import { buildExaremeAlgorithmRequest } from '../../../../ExaremeAPIAdapter';
import Result from '../../../../../Result/Result';
import {
  createExperiment,
  createModel,
  waitForResult
} from '../../../../../utils/TestUtils';
import { VariableEntity } from '../../../../Core';

// config

const modelSlug = `model-${Math.round(Math.random() * 10000)}`;
const experimentCode = 'ANOVA';
const parameters = [
  { code: 'bins', value: '40' },
  { code: 'iterations_max_number', value: 20 },
  { code: 'sstype', value: 2 },
  { code: 'outputformat', value: 'pfa' }
];
const datasets = [{ code: 'adni' }];
const model: any = (datasets: VariableEntity[]) => ({
  query: {
    coVariables: [],
    filters: '',
    groupings: [{ code: 'alzheimerbroadcategory' }],
    testingDatasets: [],
    trainingDatasets: datasets.map(d => ({
      code: d.code
    })),
    validationDatasets: [],
    variables: [
      {
        code: 'lefthippocampus'
      }
    ]
  }
});

// Test

describe('Integration Test for experiment API', () => {
  beforeAll(async () => {
    const mstate = await createModel({
      model: model(datasets),
      modelSlug
    });
    expect(mstate.error).toBeFalsy();
    expect(mstate.model).toBeTruthy();

    return true;
  });

  it(`create ${experimentCode}`, async () => {
    const requestParameters = buildExaremeAlgorithmRequest(
      model(datasets),
      { code: experimentCode },
      parameters
    );

    const payload: ExperimentPayload = {
      algorithms: [
        {
          code: experimentCode,
          name: experimentCode, // FIXME: name is used to parse response which is bad !!!
          parameters: requestParameters,
          validation: false
        }
      ],
      model: modelSlug,
      name: `${experimentCode}-${modelSlug}`,
      validations: [],
      source: 'exareme'
    };

    const { error, experiment } = await createExperiment({
      experiment: payload
    });
    expect(error).toBeFalsy();
    expect(experiment).toBeTruthy();

    const uuid = experiment && experiment.uuid;
    expect(uuid).toBeTruthy();
    if (!uuid) {
      throw new Error('uuid not defined');
    }

    const experimentState = await waitForResult({ uuid });
    expect(experimentState.error).toBeFalsy();
    expect(experimentState.experiment).toBeTruthy();

    const props = { experimentState };
    const wrapper = mount(<Result {...props} />);
    expect(wrapper.find('.error')).toHaveLength(0);
    expect(wrapper.find('.loading')).toHaveLength(0);
    expect(wrapper.find('div#tabs-methods')).toHaveLength(1);
  });
});
