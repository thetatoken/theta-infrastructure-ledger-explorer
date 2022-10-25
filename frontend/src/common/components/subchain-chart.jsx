import React, { useEffect, useState } from "react";
import get from 'lodash/get';
import ThetaChart from 'common/components/chart';
import { transactionsService } from 'common/services/transaction';
import BigNumber from 'bignumber.js';


const stakes = [{ 'amount': '108038964603624249002532', 'source': '0x372D9d124D9B2B5598109009525533578aDF9d45' },
{ 'amount': '100000000000000000000000', 'source': '0x2E833968E5bB786Ae419c4d13189fB081Cc43bab' },
{ 'amount': '91240996960566334409422', 'source': '0x2f63946ff190Bd82E053fFF553ef208FbDEB2e67' },
{ 'amount': '601391620209164005508', 'source': '0x11Ac5dCCEa0603a24E10B6f017C7c3285D46CE8e' }]
const sum = stakes.reduce((s, o) => s.plus(new BigNumber(o.amount)), new BigNumber(0));
const stakeLabels = stakes.map(o => o.source);
const stakeData = stakes.map(o => new BigNumber(o.amount).dividedBy(sum / 100).toFixed(2))

const SubchainChart = ({ }) => {

  const [txTs, setTxTs] = useState([]);
  const [txNumber, setTxNumber] = useState([]);

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

    getTransactionHistory();

  }, [])

  return <div className="subchain-chart">
    <div></div>
    <div className="subchain-chart__column">
      {txNumber.length > 0 && <div className="chart-container">
        <div className="title">SUBCHAIN TRANSACTION HISTORY (14 DAYS)</div>
        <ThetaChart chartType={'line'} labels={txTs} data={txNumber} clickType={''} />
      </div>}
    </div>
    <div className="subchain-chart__column">
      <div className="chart-container half">
        <div className="title">SUBCHAIN VALIDATOR NODES</div>
        <ThetaChart chartType={'doughnut'} labels={stakeLabels}
          data={stakeData} clickType={'stake'} />
      </div>
    </div>
    <div></div>
  </div>
}

export default SubchainChart;