import React, { useState, useEffect } from "react";
import get from 'lodash/get';

import Detail from 'common/components/dashboard-detail';
import { formatNumber } from 'common/helpers/utils';
import { accountService } from 'common/services/account';
import { transactionsService } from 'common/services/transaction';
import { blocksService } from 'common/services/block';
import config from "../../config";

const host = window.location.host;
const isMetaChain = host.match(/metachain-explorer/gi) !== null;

const DashboardRow = () => {
  const [totalWallet, setTotalWallet] = useState(0);
  const [dailyActiveAccount, setDailyActiveAccount] = useState(0);
  const [blockNum, setBlockNum] = useState(0);
  const [txnNum, setTxnNum] = useState(0);
  useEffect(() => {
    let flag = true;
    if (!isMetaChain) {
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
      return;
    } else {

      fetchData();
    }

    async function fetchData() {
      try {
        let uri = config.chainInfo.mainchain.host + ":" + config.chainInfo.mainchain.restApiPort + '/api/';
        let res = await accountService.getTotalWallets(uri);
        let aNum = get(res, 'data.total_number_account');
        res = await accountService.getDailyActiveWallets(uri);
        let wNum = get(res, 'data.body.amount');
        res = await blocksService.getTotalBlockNumber(24, uri);
        let bNum = get(res, 'data.body.total_num_block');
        res = await transactionsService.getTotalTransactionNumber(24, uri);
        let tNum = get(res, 'data.body.total_num_tx');
        for (let i = 0; i < config.chainInfo.subchains.length; i++) {
          let uri = config.chainInfo.subchains[i].host + ":" + config.chainInfo.subchains[i].restApiPort + '/api/';
          res = await accountService.getTotalWallets(uri)
          aNum += get(res, 'data.total_number_account');
          res = await accountService.getDailyActiveWallets(uri);
          wNum += get(res, 'data.body.amount');
          res = await blocksService.getTotalBlockNumber(24, uri);
          bNum += get(res, 'data.body.total_num_block');
          res = await transactionsService.getTotalTransactionNumber(24, uri);
          tNum += get(res, 'data.body.total_num_tx');
        }
        if (!flag) return;
        setTotalWallet(aNum);
        setDailyActiveAccount(wNum);
        setBlockNum(bNum);
        setTxnNum(tNum);
      } catch (err) {
        console.log(err)
      }
    }

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