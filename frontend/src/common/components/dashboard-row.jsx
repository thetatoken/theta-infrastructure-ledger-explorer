import React, { useState, useEffect } from "react";
import get from 'lodash/get';

import Detail from 'common/components/dashboard-detail';
import { formatNumber } from 'common/helpers/utils';
import { accountService } from 'common/services/account';
import { stakeService } from 'common/services/stake';
import BigNumber from 'bignumber.js';
import { WEI } from 'common/constants';

const DashboardRow = () => {
  const [totalWallet, setTotalWallet] = useState(0);
  const [dailyActiveAccount, setDailyActiveAccount] = useState(0);
  const [totalStakedTfuel, setTotalStakedTfuel] = useState(0);
  useEffect(() => {
    let flag = true;
    accountService.getTotalWallets()
      .then(res => {
        if (!flag) return;
        setTotalWallet(get(res, 'data.total_number_account') || 0);
      })
    accountService.getDailyActiveWallets()
      .then(res => {
        if (!flag) return;
        setDailyActiveAccount(get(res, 'data.body.amount') || 0);
      })
    stakeService.getTotalTFuelStake()
      .then(res => {
        if (!flag) return;
        setTotalStakedTfuel(new BigNumber(get(res, 'data.body.totalAmount')).dividedBy(WEI) || 0);
      })
    return () => flag = false;
  }, [])

  return <div className="dashboard-row half">
    <div className="column"></div>
    <div className="column">
      <Detail title={'STAKED TO EEN'} value={<StakedTFuel totalStakedTfuel={totalStakedTfuel} />} />
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

const StakedTFuel = ({ totalStakedTfuel }) => {
  return totalStakedTfuel > 0 ? <div className="currency tfuelwei sml">{formatNumber(totalStakedTfuel)}</div> : '-';
}