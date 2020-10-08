import React from "react";
import { Link } from 'react-router-dom';
import cx from 'classnames';
import { formatCoin } from 'common/helpers/utils';
import map from 'lodash/map';
import _truncate from 'lodash/truncate'

const TRUNC = 20;

export default class StakesTable extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isSliced: true,
      stakeList: this.props.stakes.slice(0, TRUNC)
    };

  }
  static defaultProps = {

  }

  toggleList() {
    if (this.state.isSliced) {
      this.setState({ stakeList: this.props.stakes, isSliced: false })
    } else {
      this.setState({ stakeList: this.props.stakes.slice(0, TRUNC), isSliced: true })
    }
  }
  componentDidUpdate(preProps) {
    if (preProps.stakes.length !== this.props.stakes.length) {
      this.setState({ stakeList: this.props.stakes.slice(0, TRUNC), isSliced: true })
    }
  }

  render() {
    const { className, type, truncate, totalStaked, stakes } = this.props;
    const { stakeList, isSliced } = this.state;
    let colSpan = type === 'node' ? 4 : 3;
    return (
      <div className="stakes half">
        <div className="title">{type === 'node' ? 'TOP VALIDATOR / GUARDIAN NODES' : 'TOP STAKING WALLETS'}</div>
        <table className={cx("data txn-table", className)}>
          <thead>
            <tr onClick={this.toggleList.bind(this)}>
              <th className="address">ADDRESS</th>
              {type === 'node' && <th className="node-type">TYPE</th>}
              <th className="staked">TOKENS STAKED</th>
              <th className="staked-prct">%STAKED</th>
            </tr>
          </thead>
          <tbody className="stake-tb">
            {map(stakeList, record => {
              const address = type === 'node' ? record.holder : record.source;
              return (
                <tr key={address}>
                  <td className="address"><Link to={`/account/${address}`}>{_truncate(address, { length: truncate })}</Link></td>
                  {type === 'node' && <td className={cx("node-type", record.type)}>{record.type === 'vcp' ? 'Validator' : 'Guardian'}</td>}
                  <td className="staked"><div className="currency thetawei">{formatCoin(record.amount, 0)}</div></td>
                  <td className="staked-prct">{(record.amount / totalStaked * 100).toFixed(2)}%</td>
                </tr>);
            })}
            {stakes.length > TRUNC &&
              <tr>
                <td className="arrow-container" colSpan={colSpan} onClick={this.toggleList.bind(this)}>
                  View {isSliced ? 'More' : 'Less'}
                </td>
              </tr>
            }
            <tr><td className="empty"></td></tr>
            <tr>
              <td></td>
              {type === 'node' && <td></td>}
              <td className="staked"><div className="currency thetawei">{formatCoin(totalStaked, 0)}</div></td>
              <td className="staked-prct">100%</td>
            </tr>
          </tbody>
        </table>
      </div>);
  }
}
