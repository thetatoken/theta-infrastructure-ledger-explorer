import React from "react";
import get from 'lodash/get';

import { Link } from 'react-router-dom';
import { stakeService } from 'common/services/stake';
import ThetaChart from 'common/components/chart';
import { sumCoin } from 'common/helpers/utils';
import StakesTable from "../common/components/stakes-table";

import BigNumber from 'bignumber.js';


export default class Stakes extends React.Component {
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
    const types = this.props.stakeCoinType === 'tfuel' ? ['eenp'] : ['vcp', 'gcp'];
    stakeService.getAllStake(types)
      .then(res => {
        const stakeList = get(res, 'data.body')
        let sum = stakeList.reduce((sum, info) => { return sumCoin(sum, info.withdrawn ? 0 : info.amount) }, 0);
        let holderObj = stakeList.reduce((map, obj) => {
          if (!map[obj.holder]) {
            map[obj.holder] = {
              type: obj.type,
              amount: 0
            };
          }
          map[obj.holder].amount = sumCoin(map[obj.holder].amount, obj.withdrawn ? 0 : obj.amount).toFixed()
          return map;
        }, {});
        let sourceObj = stakeList.reduce((map, obj) => {
          if (!map[obj.source]) {
            map[obj.source] = {
              amount: 0
            };
          }
          map[obj.source].amount = sumCoin(map[obj.source].amount, obj.withdrawn ? 0 : obj.amount).toFixed()
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
    const { stakeCoinType } = this.props;
    const { holders, percentage, sortedStakesByHolder, sortedStakesBySource, totalStaked } = this.state;
    let isTablet = window.screen.width <= 768;
    const truncate = isTablet ? 10 : 20;
    const title = `TOTAL ${stakeCoinType === 'tfuel' ? 'TFUEL' : 'THETA'} STAKED`;
    const legend = stakeCoinType === 'tfuel' ? 'TFUEL NODES' : 'THETA NODES';
    return (
      <div className="content stakes">
        <div className="page-title stakes">{title}</div>
        <div className="chart-container">
          <ThetaChart chartType={'doughnut'} labels={holders} data={percentage} clickType={'account'} />
        </div>
        <div className="legend">
          {legend}
          <div className="stake-switch-container">
            STAKED TOKEN
            <Link to={stakeCoinType === 'theta' ? "/stakes/tfuel" : "/stakes/theta"}>
            <label className="stake-switch">
              <input type="checkbox" className="checkbox" defaultChecked={stakeCoinType === 'tfuel'} />
              <span className="slider"></span>
            </label>
            </Link>
          </div>
        </div>
        <div className="table-container">
          <StakesTable type='wallet' stakeCoinType={stakeCoinType} stakes={sortedStakesBySource}
            totalStaked={totalStaked} truncate={truncate} />
          <StakesTable type='node' stakeCoinType={stakeCoinType} stakes={sortedStakesByHolder}
            totalStaked={totalStaked} truncate={truncate} />
        </div>
      </div>
    );
  }
}