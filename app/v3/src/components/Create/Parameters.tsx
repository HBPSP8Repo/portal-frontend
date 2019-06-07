import * as React from 'react';
import { Col, Form, FormControl, FormGroup, HelpBlock } from 'react-bootstrap';

import { APICore } from '../API';
import { AlgorithmParameter, VariableEntity } from '../API/Core';
import { Query } from '../API/Model';
import CategoryChooser from './CategoryValuesChooser';

interface Props {
  apiCore: APICore;
  method?: any;
  parameters?: [AlgorithmParameter];
  query?: Query;
  handleChangeParameters: (parameters: any) => void;
}
class Parameters extends React.Component<Props> {
  public render() {
    const { apiCore, method, parameters, query } = this.props;

    const categoricalVariables: VariableEntity[] | undefined = query && [
      ...(query.groupings || []),
      ...(query.coVariables || []),
      ...(query.variables || [])
    ];

    return (
      <div>
        {method && (
          <div>
            <h4>
              <strong>{method.label}</strong>
            </h4>
            <p>{method.description}</p>
            {/* <pre>{JSON.stringify(method.constraints, null, 4)}</pre> */}
          </div>
        )}
        {!method && (
          <div>
            <h4>
              <strong>Your method</strong>
            </h4>
            <p style={{ color: 'orange' }}>
              Please, select the method to be performed in the 'Available
              Methods' panel
            </p>
          </div>
        )}
        {parameters && parameters.length > 0 && <h4>Parameters</h4>}
        {parameters && parameters.length > 0 && (
          <Form horizontal={true}>
            {parameters &&
              parameters.length &&
              parameters.map((parameter: AlgorithmParameter) => {
                const numberTypes = [
                  'int',
                  'integer',
                  'real',
                  'number',
                  'numeric'
                ];
                const type = numberTypes.includes(parameter.type)
                  ? 'number'
                  : 'text';
                const { constraints } = parameter;

                return (
                  <FormGroup
                    validationState={this.getValidationState(parameter)}
                    key={parameter.code}
                    style={{
                      display:
                        parameter.visible === undefined || parameter.visible
                          ? 'inline'
                          : 'none'
                    }}>
                    <Col sm={12}>{parameter.description}</Col>
                    <Col sm={6}>{parameter.label}</Col>
                    <Col sm={6}>
                      {parameter.type !== 'enumeration' &&
                        parameter.type !== 'referencevalues' && (
                          <FormControl
                            type={type}
                            defaultValue={
                              parameter.value || parameter.default_value
                            }
                            // tslint:disable-next-line jsx-no-lambda
                            onChange={event =>
                              this.handleChangeParameter(event, parameter.code)
                            }
                          />
                        )}
                      {parameter.type === 'referencevalues' && (
                        <CategoryChooser
                          apiCore={apiCore}
                          categoricalVariables={categoricalVariables}
                        />
                      )}

                      {parameter.type === 'enumeration' && (
                        <FormControl
                          componentClass='select'
                          placeholder='select'
                          defaultValue={
                            parameter.value || parameter.default_value
                          }
                          // tslint:disable-next-line jsx-no-lambda
                          onChange={event =>
                            this.handleChangeParameter(event, parameter.code)
                          }>
                          {parameter.values &&
                            parameter.values.map((v: any) => (
                              <option key={v} value={v}>
                                {v}
                              </option>
                            ))}
                        </FormControl>
                      )}

                      <FormControl.Feedback />
                      <HelpBlock>
                        {constraints && constraints.required && 'required '}
                        {constraints &&
                          constraints.min >= 0 &&
                          'min: ' + constraints.min}
                        {constraints &&
                          constraints.min >= 0 &&
                          constraints.max >= 0 &&
                          ', '}
                        {constraints &&
                          constraints.max >= 0 &&
                          'max: ' + constraints.max}
                      </HelpBlock>
                    </Col>
                  </FormGroup>
                );
              })}
          </Form>
        )}
      </div>
    );
  }

  private getValidationState = (params: any) => {
    const { constraints, code } = params;
    const { parameters } = this.props;
    if (constraints && parameters) {
      const { min, max } = constraints;
      const parameter = parameters.find(
        (p: AlgorithmParameter) => p.code === code
      );
      if (
        (parameter && parameter.value < min) ||
        (parameter && parameter.value > max)
      ) {
        return 'error';
      }

      const required = constraints.required;
      if (required && !(parameter && parameter.value)) {
        return 'error';
      }
    }

    return 'success';
  };

  private handleChangeParameter = (event: any, code: string) => {
    event.preventDefault();
    const currentParameters = this.props.parameters;
    if (currentParameters && currentParameters.length) {
      const o = (element: any) => element.code === code;
      const index = currentParameters.findIndex(o);
      const parameter = currentParameters.find(o);
      if (parameter) {
        parameter.value = event.target.value;
        currentParameters.splice(index, 1, parameter);
        this.props.handleChangeParameters(currentParameters);
      }
    }
  };
}

export default Parameters;