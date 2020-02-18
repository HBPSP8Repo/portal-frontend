import request from 'request-promise-native';
import { Container } from 'unstated';
import { backendURL } from '../API';
import { ENABLED_ALGORITHMS, UI_HIDDEN_PARAMETERS } from '../constants';
import { Engine } from './Experiment';
import { buildWorkflowAlgorithmList } from './WorkflowAPIAdapter';
import { InstanceMode } from '../App/App';

export interface Variable {
  code: string;
  label?: string;
}
export interface VariableEntity extends Variable {
  type?: string;
  sqlType?: string;
  description?: string;
  enumerations?: Variable[];
  group?: Variable[];
  isCategorical?: boolean;
  info?: string;
}

interface Pathology {
  code: string;
  label: string;
  datasets: VariableEntity[];
  hierarchy: Hierarchy;
}

interface Hierarchy {
  code: string;
  label: string;
  groups: VariableEntity[];
  variables: VariableEntity[];
}

export interface Algorithm {
  name: string;
  label?: string;
  desc?: string;
  parameters: AlgorithmParameter[] | AlgorithmParameterRequest[];
  type: string;
}

export interface AlgorithmResult {
  name: string;
  mime: string;
  data: any[];
  error?: string;
}

// FIXME should be private
export interface AlgorithmConstraintParameter {
  binominal?: boolean;
  integer?: boolean;
  polynominal?: boolean;
  real?: boolean;
  min_count?: number;
  max_count?: number;
}

export interface AlgorithmConstraint {
  variable: AlgorithmConstraintParameter;
  covariable: AlgorithmConstraintParameter;
  groupings: AlgorithmConstraintParameter;
  mixed: boolean;
}

export interface AlgorithmParameter {
  name: string;
  label?: string;
  defaultValue: string;
  placeholder: string;
  desc: string;
  type: string;
  columnValuesSQLType: string;
  columnValuesIsCategorical: string;
  columnValuesNumOfEnumerations: string;
  value: string;
  valueNotBlank: boolean;
  valueMultiple: boolean;
  valueMin?: number;
  valueMax?: number;
  valueType: string;
  visible?: boolean;
  valueEnumerations?: string[];
}

export interface AlgorithmParameterRequest {
  name: string;
  value: string;
}

export interface Parameter {
  name: string;
  value: any;
}

export interface Stats {
  articles: number;
  users: number;
  variables: number;
}

export interface Article {
  abstract?: string;
  content?: string;
  slug: string;
  status?: string;
  title?: string;
}

export interface GalaxyConfig {
  authorization?: string;
  context?: string;
  error?: string;
}

export interface State {
  error?: string;
  loading?: boolean;
  algorithms?: Algorithm[];
  pathologies?: VariableEntity[];
  pathologyJSON?: Pathology[];
  article?: Article;
  articles?: Article[];
  stats?: Stats;
  variables?: VariableEntity[];
  galaxy?: GalaxyConfig;
}

class Core extends Container<State> {
  public state: State = {};

  private options: request.Options;
  private backendURL: string;

  constructor(config: any) {
    super();
    this.options = config.options;
    this.backendURL = backendURL;
  }

  formatLookup = (code: string, originalVar: VariableEntity | undefined) => {
    if (originalVar) {
      const info = `${originalVar.label} (${originalVar.type})`;
      return { ...originalVar, info };
    } else {
      return { code, label: code, info: code };
    }
  };

  // FIXME: those infos should be in the frontend model
  public lookup = (code: string): VariableEntity => {
    const variables = this.state.variables;

    if (variables) {
      const originalVar =
        variables &&
        variables.find((variable: VariableEntity) => variable.code === code);

      return this.formatLookup(code, originalVar);
    } else {
      const pathologyJSON = this.state.pathologyJSON;
      if (pathologyJSON) {
        let variables: any = [];

        const dummyAccumulator = (node: any) => {
          if (node.variables) {
            variables = [...variables, ...node.variables];
          }

          if (node.groups) {
            return node.groups.map(dummyAccumulator);
          }
        };

        pathologyJSON.map(p => dummyAccumulator(p.hierarchy));
        this.setState({ variables });

        const originalVar =
          variables &&
          variables.find((variable: any) => variable.code === code);

        return this.formatLookup(code, originalVar);
      }
    }

    return { code, label: code, info: code };
  };

  public fetchPathologies = async (): Promise<void> => {
    try {
      const data = await request.get(
        `${this.backendURL}/pathologies`,
        this.options
      );
      const json = await JSON.parse(data);
      if (json.error) {
        return await this.setState({
          error: json.error
        });
      }

      const pathologies = json.map((h: any) => ({
        code: h.code,
        label: h.label
      }));

      return await this.setState({
        error: undefined,
        pathologies: pathologies,
        pathologyJSON: json
      });
    } catch (error) {
      return await this.setState({
        error: error.message
      });
    }
  };

  public datasetsForPathology = (
    code: string | undefined
  ): VariableEntity[] | undefined => {
    const pathologyJSON = this.state.pathologyJSON;
    if (code && pathologyJSON) {
      const pathology = pathologyJSON.find(p => p.code === code);

      return pathology && pathology.datasets;
    }

    return undefined;
  };

  public hierarchyForPathology = (code: string | undefined) => {
    const pathologyJSON = this.state.pathologyJSON;
    if (code && pathologyJSON) {
      const pathology = pathologyJSON.find(p => p.code === code);

      return pathology && pathology.hierarchy;
    }

    return undefined;
  };

  public variablesForPathology = (code: string | undefined) => {
    const pathologyJSON = this.state.pathologyJSON;
    if (code && pathologyJSON) {
      const pathology = pathologyJSON.find(p => p.code === code);

      let variables: any = [];

      // TODO: fanciest function
      const dummyAccumulator = (node: any) => {
        if (node.variables) {
          variables = [...variables, ...node.variables];
        }

        if (node.groups) {
          return node.groups.map(dummyAccumulator);
        }
      };

      if (pathology) {
        dummyAccumulator(pathology.hierarchy);
      }
      return variables;
    }

    return undefined;
  };

  public stats = async (): Promise<void> => {
    try {
      const data = await request.get(`${this.backendURL}/stats`, this.options);
      const json = await JSON.parse(data);
      if (json.error) {
        return await this.setState({
          error: json.error
        });
      }

      return await this.setState({
        error: undefined,
        stats: json
      });
    } catch (error) {
      return await this.setState({
        error: error.message
      });
    }
  };

  public algorithms = async (mode: InstanceMode): Promise<void> => {
    const exaremeAlgorithms = await this.fetchAlgorithms();
    this.setState(state => ({
      ...state,
      algorithms: [
        ...(state.algorithms || []),
        ...((exaremeAlgorithms && exaremeAlgorithms.data) || [])
      ],
      error: undefined
    }));

    return Promise.resolve();
  };

  public articles = async (): Promise<void> => {
    try {
      const data = await request.get(
        `${this.backendURL}/articles`,
        this.options
      );
      const json = await JSON.parse(data);
      if (json.error) {
        return await this.setState({
          error: json.error
        });
      }

      return await this.setState({
        articles: json,
        error: undefined
      });
    } catch (error) {
      return await this.setState({
        error: error.message
      });
    }
  };

  public createArticle = async (payload: Article): Promise<void> => {
    try {
      const data = await request({
        body: JSON.stringify(payload),
        headers: {
          ...this.options.headers,
          'Content-Type': 'application/json;charset=UTF-8'
        },
        method: 'POST',
        uri: `${this.backendURL}/articles`
      });
      const json = await JSON.parse(data);
      await this.setState({
        article: json,
        error: undefined
      });

      return json.slug;
    } catch (error) {
      return await this.setState({
        error: error.message
      });
    }
  };

  public updateArticle = async (
    slug: string,
    payload: Article
  ): Promise<void> => {
    try {
      const data = await request({
        body: JSON.stringify(payload),
        headers: {
          ...this.options.headers,
          'Content-Type': 'application/json;charset=UTF-8'
        },
        method: 'PUT',
        uri: `${this.backendURL}/articles/${slug}`
      });
      const json = await JSON.parse(data);
      await this.setState({
        article: json,
        error: undefined
      });

      return json.slug;
    } catch (error) {
      return await this.setState({
        error: error.message
      });
    }
  };

  public fetchGalaxyConfiguration = async (): Promise<void> => {
    try {
      const data = await request.get(`${this.backendURL}/galaxy`, this.options);
      const json = await JSON.parse(data);
      if (json.error) {
        return await this.setState({
          galaxy: { error: json.error }
        });
      }

      return await this.setState({
        galaxy: json
      });
    } catch (error) {
      return await this.setState({
        galaxy: { error: error.message }
      });
    }
  };

  private fetchAlgorithms = async (): Promise<{
    error: string | undefined;
    data: Algorithm[] | undefined;
  }> => {
    try {
      const response = await request.get(
        `${this.backendURL}/algorithms`,
        this.options
      );
      const json = await JSON.parse(response);

      if (json.error) {
        return { error: json.error, data: undefined };
      }

      const data = json.filter((algorithm: Algorithm) =>
        ENABLED_ALGORITHMS.includes(algorithm.name)
      );

      // FIXME: Algorithms defnition in Exareme will contains those extra parameters.
      const extraParametersData = data.map((algorithm: Algorithm) => ({
        ...algorithm,
        engine: Engine.Exareme,
        parameters: [
          ...(algorithm.parameters as AlgorithmParameter[]).map(
            (p: AlgorithmParameter) => {
              const visible = !UI_HIDDEN_PARAMETERS.includes(p.name);

              // Semantic adjustements:
              // For historical reason, exareme serves a "value" as a "defaultValue".
              // doesn't work for x,y,dataset and pathology. So we blank our "value", and
              // assign the default on the fly, if the user didn't provide it's own value
              // Exareme's "defaultValue" in an other hand is a placeholder, a recommendation

              const parameter = {
                ...p,
                value: visible ? p.value : '',
                defaultValue: p.value,
                placeholder: p.defaultValue,
                visible
              };

              if (parameter.name === 'standardize') {
                return {
                  name: 'standardize',
                  valueEnumerations: ['false', 'true'],
                  defaultValue: 'false',
                  value: 'false',
                  desc: 'Standardize'
                };
              }

              return parameter;
            }
          ),
          // TODO: delete this once we have the formula
          ...(algorithm.name === 'ANOVA' ||
          algorithm.name === 'LINEAR_REGRESSION'
            ? [
                {
                  name: 'design',
                  valueEnumerations: ['none', 'factorial', 'additive'],
                  defaultValue: 'none',
                  value: 'none',
                  desc: 'Operator for the variables'
                }
              ]
            : [])
        ]
      }));

      return { error: undefined, data: extraParametersData };
    } catch (error) {
      console.log(error);
      return { error, data: undefined };
    }
  };
}

export default Core;
