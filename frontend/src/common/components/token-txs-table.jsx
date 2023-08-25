import React, { useEffect } from 'react';
import { Link } from "react-router-dom";
import { formatQuantity } from 'common/helpers/utils';
import { TokenIcons } from 'common/constants';
import { hash, age } from 'common/helpers/transactions';
import cx from 'classnames';
import map from 'lodash/map';
import get from 'lodash/get';
import _truncate from 'lodash/truncate';
import { formatCoin } from '../helpers/utils';
import config from '../../config';
import { ChainType } from "../constants";

const isSubChain = config.chainType === ChainType.SUBCHAIN;
const xChainName = isSubChain ? 'Main Chain' : 'Sub Chain';

const TokenTxsTable = ({ transactions, type, className, address, tabType, tokenMap, handleHashScroll }) => {
  const NUM_TRANSACTIONS = type === 'TFUEL' ? 30 : 25;
  useEffect(() => {
    if (handleHashScroll) handleHashScroll();
  }, [transactions])
  return (
    <table className={cx("data txn-table", className)}>
      <thead>
        <tr>
          <th className="hash">Txn Hash</th>
          <th className="age">Age</th>
          <th className="from">From</th>
          {tabType !== "token" && <th className="icon"></th>}
          <th className="to">To</th>
          {(type === 'TNT-721' || type === 'XCHAIN_TNT721' || type === 'XCHAIN_TNT1155') && <th className="tokenId">TokenId</th>}
          {(type === 'TNT-20' || type === 'TFUEL' || type === 'XCHAIN_TFUEL' || type === 'XCHAIN_TNT20' || type === 'XCHAIN_TNT1155')
            && <th className="quantity">Quantity</th>}
          {(type === 'TNT-721' || type === 'XCHAIN_TNT721') && <th>Token</th>}
        </tr>
      </thead>
      <tbody>
        {map(transactions, (txn, i) => {
          const isXChain = type ? type.includes("XCHAIN_") : false;
          let source = !address ? 'none' : address === txn.from ? 'from' : 'to';
          if (isXChain) {
            switch (type) {
              case 'XCHAIN_TFUEL':
                source = txn.to.length > 42 ? 'from' : 'to';
                break;
              case 'XCHAIN_TNT20':
              case 'XCHAIN_TNT721':
              case 'XCHAIN_TNT1155':
                if (txn.to === "0x0000000000000000000000000000000000000000") source = 'from'
                else if (txn.from === "0x0000000000000000000000000000000000000000") source = 'to'
                break;
              default:
                break;
            }
          }
          const name = get(tokenMap, `${txn.contract_address}.name`) || txn.name || "";
          const decimals = get(tokenMap, `${txn.contract_address}.decimals`);
          const quantity = decimals ? formatQuantity(txn.value, decimals) : txn.value;
          return (
            <tr key={i}>
              <td className="hash overflow"><Link to={`/txs/${txn.hash}`}>{hash(txn, 30)}</Link></td>
              <React.Fragment>
                <td className="age">{age(txn)}</td>
                <td className={cx({ 'dim': source === 'to' }, "from")}>
                  {(isXChain && source === 'to') ? xChainName + (txn.from.length > 42 ? ' ' + txn.from.split('_')[1] : '') :
                    <AddressTNS hash={txn.from} tns={txn.fromTns} truncate={NUM_TRANSACTIONS} />}
                </td>
                {tabType !== "token" && <td className={cx(source, "icon")}></td>}
                <td className={cx({ 'dim': source === 'from' }, "to")}>
                  {(isXChain && source === 'from') ? xChainName + (txn.to.length > 42 ? ' ' + txn.to.split('_')[1] : '') :
                    <AddressTNS hash={txn.to} tns={txn.toTns} truncate={NUM_TRANSACTIONS} />}
                </td>
                {(type === 'TNT-721' || type === 'XCHAIN_TNT721' || type === 'XCHAIN_TNT1155') && <td className="tokenId">
                  <Link to={`/token/${txn.contract_address}?a=${txn.token_id}`}>{txn.token_id}</Link>
                </td>}
                {(type === 'TFUEL' || type === 'XCHAIN_TFUEL') && <td className="quantity">
                  <div className="currency tfuel">
                    {formatCoin(txn.value, 2)}
                  </div>
                </td>}
                {(type === 'TNT-20' || type === 'XCHAIN_TNT20' || type === 'XCHAIN_TNT1155') && <td className="quantity">{quantity}</td>}
                {(type === 'TNT-721' || type === 'XCHAIN_TNT721') &&
                  <TokenName name={name} address={txn.contract_address} />}

              </React.Fragment>
            </tr>);
        })}
      </tbody>
    </table>
  );
}

const AddressTNS = ({ hash, tns, truncate = false }) => {
  if (tns) {
    return (
      <div className="value tooltip">
        <div className="tooltip--text">
          <p>{tns}</p>
          <p>({hash})</p>
        </div>
        <Link to={`/account/${hash}`}>{truncate ? _truncate(tns, { length: truncate }) : tns}</Link>
      </div>);
  }
  return (<Link to={`/account/${hash}`}>{truncate ? _truncate(hash, { length: truncate }) : hash}</Link>)
}

const TokenName = (props) => {
  const { name, address } = props;
  const isTruncated = name.length > 12;
  const tokenName = isTruncated ? _truncate(name, { length: 12 }) : name;
  return <td className="token">
    {isTruncated ?
      <div className={cx("tooltip", TokenIcons[name], { "currency": name })}>
        <Link to={`/token/${address}`}>{tokenName}</Link>
        <div className='tooltip--text'>{name}</div>
      </div> :
      <div className={cx(TokenIcons[name], { "currency": name })}>
        <Link to={`/token/${address}`}>{tokenName}</Link>
      </div>
    }
  </td>
}

export default TokenTxsTable;