import React, { useState, useEffect } from "react";
import get from 'lodash/get';

import Detail from 'common/components/dashboard-detail';
import { formatNumber } from 'common/helpers/utils';
import { accountService } from 'common/services/account';
import { transactionsService } from 'common/services/transaction';
import { blocksService } from 'common/services/block';

const DashboardRow = () => {
  const [totalWallet, setTotalWallet] = useState(0);
  const [dailyActiveAccount, setDailyActiveAccount] = useState(0);
  const [blockNum, setBlockNum] = useState(0);
  const [txnNum, setTxnNum] = useState(0);
  useEffect(() => {
    let flag = true;
    accountService.getTotalWallets()
      .then(res => {
        if (!flag) return;
        setTotalWallet(get(res, 'data.total_number_account') || 0);
      })
      .catch(err => {
        console.log(err);
      });
    accountService.getDailyActiveWallets()
      .then(res => {
        if (!flag) return;
        setDailyActiveAccount(get(res, 'data.body.amount') || 0);
      })
      .catch(err => {
        console.log(err);
      });
    transactionsService.getTotalTransactionNumber(24)
      .then(res => {
        setTxnNum(get(res, 'data.body.total_num_tx'))
      })
      .catch(err => {
        console.log(err);
      });
    blocksService.getTotalBlockNumber(24)
      .then(res => {
        setBlockNum(get(res, 'data.body.total_num_block'))
      })
      .catch(err => {
        console.log(err);
      });
    return () => flag = false;
  }, [])

  return <div className="dashboard-row half">
    <div className="column"></div>
    <div className="column last">
      <Detail title={'24H BLOCKS / TRANSACTIONS'} value={`${formatNumber(blockNum)} / ${formatNumber(txnNum)}`} />
    </div>
    <div className="column">
      <Detail title={'TOTAL ONCHAIN WALLETS'} value={formatNumber(totalWallet)} />
    </div>
    <div className="column">
      <Detail title={'DAILY ACTIVE WALLETS'} value={formatNumber(dailyActiveAccount)} />
    </div>
    
  </div>
}
export default React.memo(DashboardRow);