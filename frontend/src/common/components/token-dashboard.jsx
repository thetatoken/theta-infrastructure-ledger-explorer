import React from "react";
import get from 'lodash/get';
import cx from 'classnames';

import { formatNumber, formatCurrency, sumCoin } from 'common/helpers/utils';
import { transactionsService } from 'common/services/transaction';
import { stakeService } from 'common/services/stake';
import { blocksService } from 'common/services/block';
import ThetaChart from 'common/components/chart';
import Detail from 'common/components/dashboard-detail';
import BigNumber from 'bignumber.js';
import { WEI } from 'common/constants';

export default class TokenDashboard extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      blockNum: 0,
      txnNum: 0,
      totalStaked: 0,
      holders: [],
      percentage: [],
      txTs: [],
      txNumber: [],
      nodeNum: 0
    };
  }
  componentDidMount() {
    if (this.props.type === 'theta') {
      this.getTotalStaked();
      this.getAllStakes();
    }
    if (this.props.type === 'tfuel') {
      this.getTransactionNumber();
      this.getBlockNumber();
      this.getTransactionHistory();
    }
  }
  getTransactionHistory() {
    transactionsService.getTransactionHistory()
      .then(res => {
        const txHistory = get(res, 'data.body.data');
        let txTs = [];
        let txNumber = []
        txHistory.sort((a, b) => a.timestamp - b.timestamp).forEach(info => {
          txTs.push(new Date(info.timestamp * 1000));
          txNumber.push(info.number);
        })
        this.setState({ txTs, txNumber })
      })
      .catch(err => {
        console.log(err);
      });
  }
  getAllStakes() {
    stakeService.getAllStake()
      .then(res => {
        const stakeList = get(res, 'data.body')
        let sum = stakeList.reduce((sum, info) => { return sumCoin(sum, info.amount) }, 0);
        let newObj = stakeList.reduce((map, obj) => {
          if (!map[obj.holder]) map[obj.holder] = 0;
          map[obj.holder] = sumCoin(map[obj.holder], obj.amount).toFixed()
          return map;
        }, {});
        let topStakes = Array.from(Object.keys(newObj), key => {
          return { 'holder': key, 'amount': newObj[key] }
        }).sort((a, b) => {
          return b.amount - a.amount
        }).slice(0, 8)
        let sumPercent = 0;
        let objList = topStakes.map(stake => {
          let obj = {};
          obj.holder = stake.holder;
          obj.percentage = new BigNumber(stake.amount).dividedBy(sum / 100).toFixed(2);
          sumPercent += obj.percentage - '0';
          return obj;
        }).concat({ holder: 'Rest Nodes', 'percentage': (100 - sumPercent).toFixed(2) })
        this.setState({
          holders: objList.map(obj => { return obj.holder }),
          percentage: objList.map(obj => { return (obj.percentage - '0') })
        });
      })
      .catch(err => {
        console.log(err);
      });
  }
  getTransactionNumber() {
    transactionsService.getTotalTransactionNumber(24)
      .then(res => {
        const txnNum = get(res, 'data.body.total_num_tx');
        this.setState({ txnNum })
      })
      .catch(err => {
        console.log(err);
      });
  }
  getBlockNumber() {
    blocksService.getTotalBlockNumber(24)
      .then(res => {
        const blockNum = get(res, 'data.body.total_num_block');
        this.setState({ blockNum })
      })
      .catch(err => {
        console.log(err);
      });
  }
  getTotalStaked() {
    const { type } = this.props;
    stakeService.getTotalStake()
      .then(res => {
        const stake = get(res, 'data.body')
        this.setState({ totalStaked: stake.totalAmount, nodeNum: stake.totalNodes });
      })
      .catch(err => {
        console.log(err);
      });
  }
  render() {
    const { blockNum, txnNum, totalStaked, holders, percentage, txTs, txNumber, nodeNum } = this.state;
    const { tokenInfo, type } = this.props;
    const icon = type + 'wei';
    const token = type.toUpperCase();
    return (
      <React.Fragment>
        {tokenInfo && <div className={cx("dashboard-row", type)}>
          <div className="column">
            <div className={cx("currency", icon)}></div>
          </div>
          <div className="column">
            <Detail title={`${token} PRICE (USD)`} value={`\$${tokenInfo.price.toFixed(6)}`} />
            <Detail title={'MARKET CAP (USD)'} value={formatCurrency(tokenInfo.market_cap, 0)} />
          </div>
          <div className="column">
            <Detail title={'24 HR VOLUME (USD)'} value={formatCurrency(tokenInfo.volume_24h, 0)} />
            <Detail title={'CIRCULATING SUPPLY'} value={formatNumber(tokenInfo.circulating_supply)} />
          </div>
          {type === 'theta' &&
            <div className="column">
              <Detail title={'TOTAL STAKED NODES'} value={nodeNum} />
              <Detail title={'TOTAL STAKED (%)'} value={<StakedPercent staked={totalStaked} totalSupply={tokenInfo.circulating_supply} />} />
            </div>}
          {type === 'tfuel' && <div className="column">
            <Detail title={'24 HR BLOCKS'} value={formatNumber(blockNum)} />
            <Detail title={'24 HR TRANSACTIONS'} value={<TxnNumber num={txnNum} />} />
          </div>}
          <div className="column">
            {type === 'tfuel' ?
              <div className="chart-container">
                <div className="title">THETA BLOCKCHAIN TRANSACTION HISTORY (14 DAYS)</div>
                <ThetaChart chartType={'line'} labels={txTs} data={txNumber} clickType={''} />
              </div> :
              <div className="chart-container row">
                <div className="title">THETA NODES</div>
                <ThetaChart chartType={'doughnut'} labels={holders} data={percentage} clickType={'stake'} />
              </div>}
          </div>
        </div>}
      </React.Fragment>
    );
  }
}

const TxnNumber = ({ num }) => {
  const duration = 24 * 60 * 60;
  const tps = num / duration;
  return (
    <React.Fragment>
      {`${formatNumber(num)}`}
      {/* <div className="tps">[{tps.toFixed(2)} TPS]</div> */}
    </React.Fragment>
  );
}

const StakedPercent = ({ staked, totalSupply }) => {
  return (
    <React.Fragment>
      {`${new BigNumber(staked).dividedBy(WEI).dividedBy(totalSupply / 100).toFixed(2)}%`}
    </React.Fragment>
  );
}