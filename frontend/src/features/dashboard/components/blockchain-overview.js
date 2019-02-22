import React, { Component } from "react";
import { browserHistory } from 'react-router';
import { vcpService } from 'common/services/vcp';
import { BigNumber } from 'bignumber.js';


export default class BlockchainOverView extends Component {
  constructor(props) {
    super(props);
    this.state = {
      vcpInfoList: null
    };
  }
  componentDidMount() {
    browserHistory.push(`/dashboard`);
    this.getAllVcp();
  }

  getAllVcp() {
    vcpService.getAllVcp()
      .then(res => {
        switch (res.data.type) {
          case 'vcp':
            this.setState({
              vcpInfoList: res.data.body,
              errorType: null
            })
            break;
          case 'error_not_found':
            this.setState({
              errorType: 'error_not_found'
            });
            break;
          default:
            break;
        }
      }).catch(err => {
        console.log(err);
      })
  }

  render() {
    const { vcpInfoList } = this.state;
    return (
      <div className="th-status-overview">
        <div className="th-overview-table full-screen">
          <table>
            <tbody>
              <tr>
                <th className="th-overview-th__left">Validators</th>
                <th className="th-overview-th__right">
                  {vcpInfoList ? vcpInfoList.map(vcp => {
                    return (
                      <div className="tooltip" key={vcp.source}>
                        {vcp.source}
                        <div className="tooltiptext">
                        Stakes:<br />
                        {
                          Object.keys(vcp.stakes).map(address =>{
                          return(
                            `${address}: ${BigNumber(vcp.stakes[address], 10).toFormat(0)} ThataWei`
                          )
                        })}
                        </div>
                      </div>
                    )
                  }) : ""}
                </th>
              </tr>
            </tbody>
          </table>
        </div>

      </div>
    );
  }
}