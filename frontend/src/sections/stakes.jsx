import React, { Component } from "react";

import { stakeService } from 'common/services/stake';
import ThetaChart from 'common/components/chart';
import { formatNumber, formatCurrency, sumCoin } from 'common/helpers/utils';
import BigNumber from 'bignumber.js';


export default class Blocks extends Component {
  constructor(props) {
    super(props);
    this.state = {
      stakes: [],
      holders: [],
      percentage: []
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
        let topStakes = stakeList.sort((a, b) => {
          return b.amount - a.amount
        }).slice(0, 7)
        let sumPercent = 0;
        let objList = topStakes.map(stake => {
          let obj = {};
          obj.holder = stake.holder;
          obj.percentage = new BigNumber(stake.amount).dividedBy(sum).toFixed(4);
          sumPercent += obj.percentage - '0';
          return obj;
        }).concat({ holder: 'Rest Nodes', 'percentage': (1 - sumPercent).toFixed(4) })
        this.setState({
          stakes: stakeList,
          totalStaked: sum,
          holders: objList.map(obj => { return obj.holder }),
          percentage: objList.map(obj => { return (obj.percentage - '0') * 100 })
        });
      })
      .catch(err => {
        console.log(err);
      });
  }
  render() {
    const { holders, percentage } = this.state;
    return (
      <div className="content stakes">
        <div className="page-title stakes">TOTAL STAKED</div>
        <div className="chart-container">
          <ThetaChart holders={holders} percentage={percentage} />
        </div>
        <div className="legend">THETA NODES</div>
      </div>
    );
  }
}