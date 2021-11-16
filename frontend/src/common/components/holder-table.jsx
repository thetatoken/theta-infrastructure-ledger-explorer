import React from 'react';
import cx from 'classnames';
import map from 'lodash/map';
import { Link } from "react-router-dom";


const HoldersTable = ({ holders, totalSupply, className }) => {
  return (
    <table className={cx("data txn-table", className)}>
      <thead>
        <tr>
          <th className="rank">Rank</th>
          <th className="address">Address</th>
          <th className="quantity">Quantity</th>
          <th className="percentage">Percentage</th>
        </tr>
      </thead>
      <tbody>
        {map(holders, (holder, i) => {
          return (
            <tr key={i}>
              <td className="rank">{i + 1}</td>
              <td>
                <Link to={`/account/${holder.key}`}>{holder.key}</Link>
              </td>
              <td className="rank">{holder.value}</td>
              <td className="rank">{(holder.value / totalSupply * 100).toFixed(4)}%</td>
            </tr>);
        })}
      </tbody>
    </table>
  );
}

export default HoldersTable;