import React from "react";
import get from 'lodash/get';
import cx from 'classnames';

import { formatNumber, formatCurrency, sumCoin, fetchWTFuelTotalSupply, fetchWThetaTotalSupply } from 'common/helpers/utils';
import { transactionsService } from 'common/services/transaction';
import { stakeService } from 'common/services/stake';
import { blocksService } from 'common/services/block';
import ThetaChart from 'common/components/chart';
import Detail from 'common/components/dashboard-detail';
import BigNumber from 'bignumber.js';
import { WEI } from 'common/constants';
import config from "../../config";
import { ChainType } from "../constants";

const MAX_RECORD_DAYS = 60;

const host = window.location.host;
const isMetaChain = host.match(/metachain-explorer/gi) !== null;
const { mainchain } = config.chainInfo;
const uri = isMetaChain ? mainchain.hostApi + ':' + mainchain.restApiPort + '/api/' : null;
export default class TokenDashboard extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      totalStaked: 0,
      holders: { theta: [], tfuel: [] },
      percentage: { theta: [], tfuel: [] },
      txTs: [],
      txNumber: [],
      nodeNum: 0,
      tokenStaked: 0,
      tokenLocked: 0
    };
  }
  componentDidMount() {
    this.getTotalStaked();
    if (this.props.type === 'theta') {
      this.getAllStakes();
    }
    if (this.props.type === 'tfuel') {
      this.getTransactionHistory();
    }
  }
  async getTransactionHistory() {
    if (isMetaChain) {
      let txTs = [];
      let txNumber = []
      let res = await transactionsService.getTransactionHistory(MAX_RECORD_DAYS, uri);
      let txHistory = get(res, 'data.body.data');
      txHistory.sort((a, b) => a.timestamp - b.timestamp).forEach(info => {
        txTs.push(new Date(info.timestamp * 1000));
        txNumber.push(info.number);
      })
      const subChains = config.chainInfo.subchains
      for (let i = 0; i < subChains.length; i++) {
        let uri = subChains[i].hostApi + ':' + subChains[i].restApiPort + '/api/'
        try {
          res = await transactionsService.getTransactionHistory(MAX_RECORD_DAYS, uri);
          txHistory = get(res, 'data.body.data');
          txHistory.sort((a, b) => a.timestamp - b.timestamp).forEach((info, i) => {
            txNumber[i] += info.number;
          })
        } catch (e) {
          console.log('error in fetch subchain transation history:', e)
        }
      }
      this.setState({ txTs, txNumber })
      return;
    }
    transactionsService.getTransactionHistory(14, uri)
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
    stakeService.getAllStake(['eenp', 'vcp', 'gcp'], uri)
      .then(res => {
        const stakeList = get(res, 'data.body')
        let sum = stakeList.reduce((sum, info) => {
          if (info.type === 'eenp') sum.tfuel = sumCoin(sum.tfuel, info.amount)
          else sum.theta = sumCoin(sum.theta, info.amount)
          return sum;
        }, { theta: 0, tfuel: 0 });
        let newObj = stakeList.reduce((map, obj) => {
          let tmpObj = obj.type === 'eenp' ? map.tfuel : map.theta;
          if (!tmpObj[obj.holder]) tmpObj[obj.holder] = 0;
          tmpObj[obj.holder] = sumCoin(tmpObj[obj.holder], obj.amount).toFixed()
          return map;
        }, { theta: {}, tfuel: {} });
        let thetaTopHolderList = getTopHolderList(newObj.theta, sum.theta);
        let tfuelTopHolderList = getTopHolderList(newObj.tfuel, sum.tfuel);
        this.setState({
          holders: {
            theta: thetaTopHolderList.map(obj => { return obj.holder }),
            tfuel: tfuelTopHolderList.map(obj => { return obj.holder }),
          },
          percentage: {
            theta: thetaTopHolderList.map(obj => { return (obj.percentage - '0') }),
            tfuel: tfuelTopHolderList.map(obj => { return (obj.percentage - '0') })
          }
        });

        function getTopHolderList(newObj, sum) {
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
          })
          if (sumPercent === 0) objList = [{ holder: 'No Node', percentage: 100 }];
          else objList = objList.concat({ holder: 'Rest Nodes', 'percentage': (100 - sumPercent).toFixed(2) })
          return objList;
        }
      })
      .catch(err => {
        console.log(err);
      });
  }
  getTotalStaked() {
    const { type } = this.props;
    stakeService.getTotalStake(type, uri)
      .then(async res => {
        const stake = get(res, 'data.body');
        let tokenTotalSupply = 0
        try {
          if (type === 'tfuel') {
            tokenTotalSupply = await fetchWTFuelTotalSupply();
          } else if (type === 'theta') {
            tokenTotalSupply = await fetchWThetaTotalSupply();
          }
        } catch (e) {
          console.log('Error in fetch WTFuel total supply. Err:', e.message);
        }
        const totalStaked = BigNumber.sum(stake.totalAmount, tokenTotalSupply);
        this.setState({
          totalStaked: totalStaked,
          nodeNum: stake.totalNodes,
          tokenStaked: stake.totalAmount,
          tokenLocked: tokenTotalSupply
        });
      })
      .catch(err => {
        console.log(err);
      });
  }
  render() {
    const { totalStaked, holders, percentage, txTs, txNumber, nodeNum, tokenStaked, tokenLocked } = this.state;
    const { tokenInfo, type } = this.props;
    const icon = type + 'wei';
    const token = type.toUpperCase();
    const isTheta = type === 'theta';
    const isSubChain = config.chainType === ChainType.SUBCHAIN;
    const txHistoryTitle = isMetaChain ? 'THETA METACHAIN TRANSACTION HISTORY (60 DAYS)' : isSubChain ?
      "SUBCHAIN TRANSACTION HISTORY (14 DAYS)" : "THETA BLOCKCHAIN TRANSACTION HISTORY (14 DAYS)";
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
          <div className="column">
            <Detail title={isTheta ? 'TOTAL STAKED NODES' : 'TOTAL ELITE NODES'} value={nodeNum} />
            <Detail title={isTheta ? 'THETA STAKED+LOCKED (%)' : 'TFUEL STAKED+LOCKED (%)'}
              value={<StakedPercent staked={totalStaked} totalSupply={tokenInfo.circulating_supply} />}
              className="tooltip"
              tooltipText={<TokenTooltip totalSupply={tokenInfo.circulating_supply} staked={tokenStaked} locked={tokenLocked} type={type} />} />
          </div>
          <div className={`column pie-charts ${isSubChain && !isMetaChain ? 'subchain' : ''}`}>
            {type === 'tfuel' ?
              <div className="chart-container">
                <div className="title">{txHistoryTitle}</div>
                <ThetaChart chartType={'line'} labels={txTs} data={txNumber} clickType={''} />
              </div> :
              isSubChain && !isMetaChain ? <div className="chart-container half">
                <div className="title">SUBCHAIN VALIDATOR NODES</div>
                <ThetaChart chartType={'doughnut'} labels={['0x2e833968e5bb786ae419c4d13189fb081cc43bab']}
                  data={[100]} clickType={'stake'} />
              </div> : <>
                <div className="chart-container half">
                  <div className="title">THETA NODES</div>
                  <ThetaChart chartType={'doughnut'} labels={holders.theta} data={percentage.theta} clickType={'stake'} />
                </div>
                <div className="chart-container half tfuel">
                  <div className="title">ELITE EDGE NODES</div>
                  <ThetaChart chartType={'doughnut'} labels={holders.tfuel} data={percentage.tfuel} clickType={'tfuelStake'} />
                </div>
              </>}
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

const TokenTooltip = ({ staked, locked, totalSupply, type }) => {
  return <div className="tooltip--text">
    <div>
      {type} STAKED:
      <span>
        {`${new BigNumber(staked).dividedBy(WEI).dividedBy(totalSupply / 100).toFixed(2)}%`}
      </span>
    </div>
    <div>
      W{type} LOCKED:
      <span>
        {`${new BigNumber(locked).dividedBy(WEI).dividedBy(totalSupply / 100).toFixed(2)}%`}
      </span>
    </div>
  </div>
}