import React, { useState, useEffect } from "react";
import get from 'lodash/get';

import Detail from 'common/components/dashboard-detail';
import { formatQuantity, fetchAbi, fetchTokenTotalSupply, fetchTokenDecimals, fetchTokenSymbol } from 'common/helpers/utils';
import { CommonFunctionABIs } from '../constants';

const host = window.location.host;
const isMetaChain = host.match(/metachain-explorer/gi) !== null;

const DashboardRow = ({ }) => {
  const [symbol, setSymbol] = useState("");
  const [decimals, setDecimals] = useState(0);
  const [totalSupply, setTotalSupply] = useState(0);
  useEffect(() => {
    let flag = true;
    fetchData();

    async function fetchData() {
      let decimals = await fetchAbi([CommonFunctionABIs.decimals]);
      setDecimals(decimals);
      let totalSupply = await fetchAbi([CommonFunctionABIs.totalSupply]);
      setTotalSupply(totalSupply);
      let symbol = await fetchAbi([CommonFunctionABIs.symbol]);
      setSymbol(symbol);
    }
    return () => flag = false;
  }, [])

  return <div className={`dashboard-row half subchain`}>
    <div className="column"></div>
    <div className="column last">
      <Detail title={'TOKEN SYMBOL'} value={`${symbol}`} />
    </div>
    <div className="column">
      <Detail title={'TOKEN DECIMALS'} value={decimals} />
    </div>
    <div className="column">
      <Detail title={'TOTAL SUPPLY'} value={formatQuantity(totalSupply, decimals)} />
    </div>
    <div className="column"></div>
  </div>
}
export default React.memo(DashboardRow);