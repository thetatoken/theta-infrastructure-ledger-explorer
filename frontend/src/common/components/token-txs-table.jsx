import React from 'react';
import { Link } from "react-router-dom";
import { formatQuantity } from 'common/helpers/utils';
import { TokenIcons } from 'common/constants';
import { hash, age } from 'common/helpers/transactions';
import cx from 'classnames';
import map from 'lodash/map';
import get from 'lodash/get';
import _truncate from 'lodash/truncate';
import { formatCoin } from '../helpers/utils';


const TokenTxsTable = ({ transactions, type, className, address, tabType, tokenMap }) => {
  const NUM_TRANSACTIONS = type === 'TFUEL' ? 30 : 25;
  return (
    <table className={cx("data txn-table", className)}>
      <thead>
        <tr>
          <th className="hash">Txn Hash</th>
          <th className="age">Age</th>
          <th className="from">From</th>
          {tabType !== "token" && <th className="icon"></th>}
          <th className="to">To</th>
          {type === 'TNT-721' && <th className="tokenId">TokenId</th>}
          {(type === 'TNT-20' || type === 'TFUEL') && <th className="quantity">Quantity</th>}
          {type !== 'TFUEL' && tabType !== 'token' && <th>Token</th>}
        </tr>
      </thead>
      <tbody>
        {map(transactions, (txn, i) => {
          const source = !address ? 'none' : address === txn.from ? 'from' : 'to';
          const name = get(tokenMap, `${txn.contract_address}.name`) || txn.name || "";
          const decimals = get(tokenMap, `${txn.contract_address}.decimals`);
          const quantity = decimals ? formatQuantity(txn.value, decimals) : txn.value;
          return (
            <tr key={i}>
              <td className="hash overflow"><Link to={`/txs/${txn.hash}`}>{hash(txn, 30)}</Link></td>
              <React.Fragment>
                <td className="age">{age(txn)}</td>
                <td className={cx({ 'dim': source === 'to' }, "from")}>
                  <AddressTNS hash={txn.from} tns={txn.fromTns} truncate={NUM_TRANSACTIONS} />
                </td>
                {tabType !== "token" && <td className={cx(source, "icon")}></td>}
                <td className={cx({ 'dim': source === 'from' }, "to")}>
                  <AddressTNS hash={txn.to} tns={txn.toTns} truncate={NUM_TRANSACTIONS} />
                </td>
                {type === 'TNT-721' && <td className="tokenId">
                  <Link to={`/token/${txn.contract_address}?a=${txn.token_id}`}>{txn.token_id}</Link>
                </td>}
                {type === 'TFUEL' && <td className="quantity">
                  <div className="currency tfuel">
                    {formatCoin(txn.value, 2)}
                  </div>
                </td>}
                {type === 'TNT-20' && <td className="quantity">{quantity}</td>}
                {type !== 'TFUEL' && tabType !== 'token' && <TokenName name={name} address={txn.contract_address} />}

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