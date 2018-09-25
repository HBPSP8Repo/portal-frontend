// tslint:disable:no-console
import { IExperimentResult } from "@app/types";
import * as React from "react";
// import { Glyphicon } from "react-bootstrap";
import { RouteComponentProps, withRouter } from "react-router-dom";
import {
  ExperimentContainer,
  ExperimentListContainer,
  ModelContainer
} from "../containers";
import default_user from "../images/default_user.png";
// import logo from "../images/hbp-logo.png";
import { Dropdown } from "./";

import "./Navigation.css";

interface IProps extends RouteComponentProps<any> {
  experimentContainer: ExperimentContainer;
  experimentListContainer: ExperimentListContainer;
  modelContainer: ModelContainer;
}

class Navigation extends React.Component<IProps> {
  public async componentDidMount() {
    const { experimentListContainer } = this.props;
    return await experimentListContainer.load();
  }

  public render() {
    const {
      experimentListContainer,
      experimentContainer,
      modelContainer
    } = this.props;

    const unreadCount =
      (experimentListContainer &&
        experimentListContainer.state &&
        experimentListContainer.state.experiments &&
        experimentListContainer.state.experiments.filter(e => !e.resultsViewed)
          .length) ||
      undefined;

    return (
      <header
        id="topnav"
        className="navbar navbar-default navbar-fixed-top ng-scope"
      >
        <div className="container-fluid">
          <div className="logo-area">
            <a
              className="navbar-brand"
              href="/home"
              // tslint:disable-next-line jsx-no-lambda
              onClick={e => this.jumpToAngular(e, "/home")}
            >
              Human Brain Project
            </a>

            <span className="toolbar-trigger toolbar-icon-bg">
              <a
                title="My data"
                href="/data/mydata"
                // tslint:disable-next-line jsx-no-lambda
                onClick={e => this.jumpToAngular(e, "/data/maydata")}
              >
                <span className="icon-bg">
                  <i className="ti ti-menu" />
                </span>
              </a>
            </span>
            <span className="toolbar-trigger toolbar-icon-bg">
              <a
                title="My community"
                href="/data/communitydata"
                // tslint:disable-next-line jsx-no-lambda
                onClick={e => this.jumpToAngular(e, "/data/communitydata")}
              >
                <span className="icon-bg">
                  <i className="ti ti-world" />
                </span>
              </a>
            </span>
          </div>

          <div className="app-instance-name">
            <h2>DEV</h2>
          </div>

          <ul className="nav navbar-nav toolbar pull-right">
            <li className="toolbar-icon-bg hidden-xs">
              <a
                title="Epidemiological Exploration "
                href="/explore"
                // tslint:disable-next-line jsx-no-lambda
                onClick={e => this.jumpToAngular(e, "/explore")}
              >
                <span className="icon-bg">
                  <i>EE</i>
                </span>
              </a>
            </li>

            <li className="toolbar-icon-bg hidden-xs">
              <a
                title="Interactive Analysis"
                href="/review"
                // tslint:disable-next-line jsx-no-lambda
                onClick={e => this.jumpToAngular(e, "/review")}
              >
                <span className="icon-bg">
                  <i>IA</i>
                </span>
              </a>
            </li>

            <li className="toolbar-icon-bg hidden-xs">
              <a href="#" title="Biological Signature of Diseases">
                <Dropdown
                  items={experimentListContainer.state.experiments}
                  title="BSD"
                  // tslint:disable-next-line jsx-no-lambda
                  handleSelect={async (experiment: IExperimentResult) => {
                    const { modelDefinitionId, uuid } = experiment;
                    this.props.history.push(
                      `/v3/experiment/${modelDefinitionId}/${uuid}`
                    );
                    await experimentContainer.markAsViewed(uuid);
                    await modelContainer.load(modelDefinitionId);

                    return await experimentContainer.load(uuid);
                  }}
                  noCaret={true}
                />
                {unreadCount && (
                  <span className="unread_count_badge ng-binding ng-scope">
                    {unreadCount}
                  </span>
                )}
              </a>
            </li>

            <li className="uib-dropdown toolbar-icon-bg">
              <a
                href="#"
                className="uib-dropdown-toggle username"
                data-position="right"
              >
                <img
                  className="img-circle"
                  alt="anonymous"
                  src={default_user}
                />
              </a>
              <ul className="dropdown-menu userinfo arrow">
                <li>
                  <a ui-sref="profile" href="/profile">
                    <i className="ti ti-user" />
                    <span>Profile</span>
                  </a>
                </li>

                <li className="divider" />
                <li>
                  <a href="" id="logout-link" ng-click="logout()">
                    <i className="ti ti-shift-right" />
                    <span>Sign out</span>
                  </a>
                </li>
              </ul>
            </li>
            <li className="toolbar-trigger toolbar-icon-bg">
              <a
                href="https://hbpmedical.github.io/documentation/HBP_SP8_UserGuide_latest.pdf"
                target="_help"
                title="Knowledge base"
              >
                <span className="icon-bg" style={{ fontWeight: 900 }}>
                  ?
                </span>
              </a>
            </li>
            <li className="toolbar-trigger toolbar-icon-bg">
              <a ui-sref="hbpapps" title="App" href="/hbpapps">
                <span className="icon-bg">
                  <i
                    className="ti ti-layout-grid3-alt "
                    style={{ fontFamily: "themify", fontWeight: "normal" }}
                  />
                </span>
              </a>
            </li>
          </ul>
        </div>
      </header>
    );
  }

  private jumpToAngular = (e: any, location: string) => {
    e.preventDefault();
    window.location.href = `${location}`;
  };
}

export default withRouter(Navigation);
