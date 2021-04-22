import React, { useState, useEffect } from "react";
import get from 'lodash/get';
import cx from 'classnames';

import Detail from 'common/components/dashboard-detail';
import { formatNumber } from 'common/helpers/utils';
import { accountService } from 'common/services/account';

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
    return () => flag = false;
  }, [])

return <div className="dashboard-row half">
    <div className="column"></div>
    <div className="column">
      <Detail title={'TOTAL ONCHAIN WALLET ADDRESSES'} value={formatNumber(totalWallet)} />
    </div>
    <div className="column">
      <Detail title={'DAILY ACTIVE WALLETS'} value={formatNumber(dailyActiveAccount)} />
    </div>
    <div className="column">
      <Detail title={'TOTAL TFUEL STAKED TO EDGE NODES'} value={formatNumber(totalStakedTfuel)} />
    </div>
  </div>
}
export default React.memo(DashboardRow);