import React, { Component } from "react";

import { stakeService } from 'common/services/stake';
import ThetaChart from 'common/components/chart';
import { formatNumber, formatCurrency, sumCoin } from 'common/helpers/utils';
import StakesTable from "../common/components/stakes-table";

import BigNumber from 'bignumber.js';


export default class Blocks extends Component {
  constructor(props) {
    super(props);
    this.state = {
      stakes: [],
      totalStaked: 0,
      holders: [],
      percentage: [],
      sortedStakesByHolder: [],
      sortedStakesBySource: []
    };
  }

  componentDidMount() {
    this.getAllStakes();
  }

  getAllStakes() {
    stakeService.getAllStake()
      .then(res => {
        const stakeList = _.get(res, 'data.body')
        let sum = stakeList.reduce((sum, info) => { return sumCoin(sum, info.amount) }, 0);
        let holderObj = stakeList.reduce((map, obj) => {
          if (!map[obj.holder]) {
            map[obj.holder] = {
              type: obj.type,
              amount: 0
            };
          }
          map[obj.holder].amount = sumCoin(map[obj.holder].amount, obj.amount).toFixed()
          return map;
        }, {});
        let sourceObj = stakeList.reduce((map, obj) => {
          if (!map[obj.source]) {
            map[obj.source] = {
              amount: 0
            };
          }
          map[obj.source].amount = sumCoin(map[obj.source].amount, obj.amount).toFixed()
          return map;
        }, {});
        let sortedStakesByHolder = Array.from(Object.keys(holderObj), key => {
          return { 'holder': key, 'amount': holderObj[key].amount, 'type': holderObj[key].type }
        }).sort((a, b) => {
          return b.amount - a.amount
        })
        let sortedStakesBySource = Array.from(Object.keys(sourceObj), key => {
          return { 'source': key, 'amount': sourceObj[key].amount }
        }).sort((a, b) => {
          return b.amount - a.amount
        })
        let sumPercent = 0;
        let topList = sortedStakesByHolder.slice(0, 8).map(stake => {
          let obj = {};
          obj.holder = stake.holder;
          obj.percentage = new BigNumber(stake.amount).dividedBy(sum / 100).toFixed(2);
          sumPercent += obj.percentage - '0';
          return obj;
        }).concat({ holder: 'Rest Nodes', 'percentage': (100 - sumPercent).toFixed(2) })
        this.setState({
          stakes: stakeList,
          totalStaked: sum,
          holders: topList.map(obj => { return obj.holder }),
          percentage: topList.map(obj => { return (obj.percentage - '0') }),
          sortedStakesByHolder: sortedStakesByHolder,
          sortedStakesBySource: sortedStakesBySource
        });
      })
      .catch(err => {
        console.log(err);
      });
  }

  render() {
    const { holders, percentage, sortedStakesByHolder, sortedStakesBySource, totalStaked } = this.state;
    return (
      <div className="content stakes">
        <div className="page-title stakes">TOTAL STAKED</div>
        <div className="chart-container">
          <ThetaChart holders={holders} percentage={percentage} />
        </div>
        <div className="legend">THETA NODES</div>
        <div className="table-container">
          <StakesTable type='wallet' stakes={sortedStakesBySource} totalStaked={totalStaked} truncate={20} />
          <StakesTable type='node' stakes={sortedStakesByHolder} totalStaked={totalStaked} truncate={20} />
        </div>
      </div>
    );
  }
}