import React, { useEffect, useState } from "react";
import get from 'lodash/get';
import ThetaChart from 'common/components/chart';
import { transactionsService } from 'common/services/transaction';
import { stakeService } from 'common/services/stake';
import BigNumber from 'bignumber.js';
import { sumCoin } from "../helpers/utils";


const SubchainChart = ({ }) => {

  const [txTs, setTxTs] = useState([]);
  const [txNumber, setTxNumber] = useState([]);
  const [holders, setHolders] = useState([]);
  const [percentage, setPercentage] = useState([]);

  useEffect(() => {
    function getTransactionHistory() {
      transactionsService.getTransactionHistory()
        .then(res => {
          const txHistory = get(res, 'data.body.data');
          let txTs = [];
          let txNum = []
          txHistory.sort((a, b) => a.timestamp - b.timestamp).forEach(info => {
            txTs.push(new Date(info.timestamp * 1000));
            txNum.push(info.number);
          })
          setTxTs(txTs);
          setTxNumber(txNum);
        })
        .catch(err => {
          console.log(err);
        });
    }

    function getAllStakes() {
      stakeService.getSubStakes(['vs'])
        .then(res => {
          const stakeList = get(res, 'data.body');
          let sum = stakeList.reduce((sum, info) => {
            return sumCoin(sum, info.stake)
          }, 0);
          let newObj = stakeList.reduce((map, obj) => {
            if (!map[obj.address]) map[obj.address] = 0;
            map[obj.address] = sumCoin(map[obj.address], obj.stake).toFixed();
            return map;
          }, {});
          let topHolderList = getTopHolderList(newObj, sum);
          setHolders(topHolderList.map(obj => { return obj.holder }))
          setPercentage(topHolderList.map(obj => { return obj.percentage }))

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

    getTransactionHistory();
    getAllStakes();

  }, [])

  return <div className="subchain-chart">
    <div></div>
    <div className="subchain-chart__column">
      {txNumber.length > 0 && <div className="chart-container">
        <div className="title">SUBCHAIN TRANSACTION HISTORY (14 DAYS)</div>
        <ThetaChart chartType={'line'} labels={txTs} data={txNumber} clickType={''} />
      </div>}
    </div>
    {percentage.length > 0 && <div className="subchain-chart__column">
      <div className="chart-container half">
        <div className="title">SUBCHAIN VALIDATOR NODES</div>
        <ThetaChart chartType={'doughnut'} labels={holders}
          data={percentage} clickType={'stake'} />
      </div>
    </div>}
    <div></div>
  </div>
}

export default SubchainChart;