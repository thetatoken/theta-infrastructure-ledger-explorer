import React from "react";
import { Link } from 'react-router-dom';
import cx from 'classnames';
import { formatCoin } from 'common/helpers/utils';
import map from 'lodash/map';
import _truncate from 'lodash/truncate'
import tns from 'libs/tns';

const TRUNC = 20;
const TitleMap = {
  'theta_wallet': 'TOP THETA STAKING WALLETS',
  'theta_node': 'TOP VALIDATOR / GUARDIAN NODES',
  'tfuel_wallet': 'TOP TFUEL STAKING WALLETS',
  'tfuel_node': 'TOP ELITE EDGE NODES'
}
const NodeMap = {
  'vcp': 'Validator',
  'gcp': 'Guardian',
  'eenp': 'Elite Edge'
}
export default class StakesTable extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isSliced: true,
      stakeList: this.props.stakes.slice(0, TRUNC),
      totalStakeLength: this.props.stakes.length,
      curStakeLength: TRUNC
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
  loadMoreStakes() {
    this.setState({ curStakeLength: this.state.curStakeLength + TRUNC })
    this.setStakesTns(this.props.stakes, this.state.curStakeLength + TRUNC)
  }
  loadLessStakes() {
    this.setState({ curStakeLength: TRUNC })
  }
  loadAllStakes() {
    this.setState({ curStakeLength: this.state.totalStakeLength })

  }
  componentDidUpdate(preProps) {
    if (preProps.stakes.length !== this.props.stakes.length) {
      this.setState({ totalStakeLength: this.props.stakes.length, curStakeLength: TRUNC })
    }
  }

  setStakesTns = async (addresses, limit = 25) => {
    const stakes = addresses.slice(0, limit).map((x) => {
      return x.source ? x.source : x.holder
    });
    const domainNames = await tns.getDomainNames(stakes);
    addresses.map((x) => { x.tns = x.holder ? domainNames[x.holder] : x.source ? domainNames[x.source] : null });
    this.setState({ stakeList: addresses.slice(0, limit), isSliced: true });
  }


  render() {
    const { className, type, truncate, totalStaked, stakes, stakeCoinType } = this.props;
    const { stakeList, isSliced, curStakeLength, totalStakeLength } = this.state;
    let colSpan = type === 'node' ? 5 : 3;
    const titleKey = `${stakeCoinType}_${type}`;
    const currencyUnit = stakeCoinType === 'tfuel' ? 'tfuelwei' : 'thetawei';
    return (
      <div className="stakes half">
        <div className="title">{TitleMap[`${titleKey}`]}</div>
        <table className={cx("data txn-table", className)}>
          <thead>
            <tr onClick={this.toggleList.bind(this)}>
              <th className="address">ADDRESS</th>
              {type === 'node' && <th className="node-type">TYPE</th>}
              {type === 'node' && <th className="reward-prct">SPLIT</th>}
              <th className="staked">TOKENS STAKED</th>
              <th className="staked-prct">%STAKED</th>
            </tr>
          </thead>
          <tbody className="stake-tb">
            {map(stakes.slice(0, curStakeLength), record => {
              const address = type === 'node' ? record.holder : record.source;
              return (
                <tr key={address}>
                  <td className="address">
                    <AddressTNS address={address} tns={record.tns} truncate={truncate} />
                  </td>
                  {type === 'node' && <td className={cx("node-type", record.type)}>{NodeMap[`${record.type}`]}</td>}
                  {type === 'node' && <td className="reward-prct">{record.splitBasisPoint / 100 + '%'}</td>}
                  <td className="staked"><div className={cx("currency", currencyUnit)}>{formatCoin(record.amount, 0)}</div></td>
                  <td className="staked-prct">{(record.amount / totalStaked * 100).toFixed(2)}%</td>
                </tr>);
            })}
            {stakes.length > TRUNC &&
              <>
                {totalStakeLength > curStakeLength && <tr>
                  <td className="arrow-container" colSpan={colSpan} onClick={this.loadMoreStakes.bind(this)}>
                    View More
                  </td>
                </tr>}
                {curStakeLength < totalStakeLength && <tr>
                  <td className="arrow-container" colSpan={colSpan} onClick={this.loadAllStakes.bind(this)}>
                    View All
                  </td>
                </tr>}
                {curStakeLength > TRUNC && <tr>
                  <td className="arrow-container" colSpan={colSpan} onClick={this.loadLessStakes.bind(this)}>
                    View Less
                  </td>
                </tr>}
              </>
            }
            {/* <tr><td className="empty"></td></tr> */}
            <tr>
              <td></td>
              {type === 'node' && <td></td>}
              {type === 'node' && <td></td>}
              <td className="staked"><div className={cx("currency", currencyUnit)}>{formatCoin(totalStaked, 0)}</div></td>
              <td className="staked-prct">100%</td>
            </tr>
          </tbody>
        </table>
      </div>);
  }
}

const AddressTNS = ({ address, tns, truncate }) => {
  if (tns) {
    return (
      <div className="value tooltip">
        <div className="tooltip--text">
          <span>{tns}</span>
          <span>({address})</span>
        </div>
        <Link to={`/account/${address}`}>{_truncate(tns, { length: truncate })}</Link>
      </div>);
  }
  return (<Link to={`/account/${address}`}>{_truncate(address, { length: truncate })}</Link>)
}