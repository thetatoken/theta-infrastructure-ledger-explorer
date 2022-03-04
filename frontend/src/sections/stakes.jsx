import React from "react";
import get from 'lodash/get';

import { Link } from 'react-router-dom';
import { stakeService } from 'common/services/stake';
import { rewardDistributionService } from 'common/services/rewardDistribution';
import ThetaChart from 'common/components/chart';
import { sumCoin } from 'common/helpers/utils';
import StakesTable from "../common/components/stakes-table";
import BigNumber from 'bignumber.js';
import tns from 'libs/tns';


export default class Stakes extends React.Component {
  _isMounted = true;

  constructor(props) {
    super(props);
    this.state = {
      stakes: [],
      totalStaked: 0,
      holders: [],
      percentage: [],
      sortedStakesByHolder: [],
      sortedStakesBySource: [],
      rewardMap: {}
    };
  }
  componentDidMount() {
    this.getAllRewardDistribution()
  }

  componentWillUnmount() {
    this._isMounted = false;
  }

  getAllRewardDistribution() {
    const self = this;
    rewardDistributionService.getAllRewardDistribution()
      .then(res => {
        if(!self._isMounted) return;
        const list = get(res, 'data.body')
        let map = new Map();
        list.forEach(s => {
          map.set(s._id, s.splitBasisPoint)
        })
        this.setState({ rewardMap: map });
        this.getAllStakes(map);
      }).catch(err => {
        console.log(err)
      })
  }
  getAllStakes(map) {
    const types = this.props.stakeCoinType === 'tfuel' ? ['eenp'] : ['vcp', 'gcp'];
    const self = this;
    stakeService.getAllStake(types)
      .then(res => {
        if(!self._isMounted) return;
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
          const splitBasisPoint = map.get(key) || 0;
          return { 'holder': key, 'amount': holderObj[key].amount, 'type': holderObj[key].type, "splitBasisPoint": splitBasisPoint }
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
        this.setStakesTns(sortedStakesBySource, 'source', 'sortedStakesBySource');
        this.setStakesTns(sortedStakesByHolder, 'holder', 'sortedStakesByHolder');
      })
      .catch(err => {
        console.log(err);
      });
  }
  setStakesTns = async(stakes, addrKey, stateKey) => {
    const slicedStakes = stakes.slice(0, 21).map((x) => x[addrKey]);
    const domainNames = await tns.getDomainNames(slicedStakes);
    stakes.map((x) => { x.tns = x[addrKey] ? domainNames[x[addrKey]] : null });
    let state = {};
    state[stateKey] = stakes;
    this.setState(state);
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