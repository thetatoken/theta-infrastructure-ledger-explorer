import React, { useState } from 'react';
import cx from 'classnames';
import map from 'lodash/map';
import { Link } from "react-router-dom";
import Pagination from "common/components/pagination";

const NUM_PER_PAGE = 50;

const HoldersTable = ({ holders, totalSupply, className }) => {
  const totalPages = Math.ceil(holders.length / NUM_PER_PAGE);
  const [currentPage, setCurrentPage] = useState(1);
  const [currentHolders, setCurrentHolders] = useState(holders.slice(0, NUM_PER_PAGE));
  const handlePageChange = pageNumber => {
    setCurrentPage(pageNumber);
    setCurrentHolders(holders.slice((pageNumber - 1) * NUM_PER_PAGE, pageNumber * NUM_PER_PAGE));
  }
  return (
    <>
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
          {map(currentHolders, (holder, i) => {
            const percent = totalSupply ? (holder.amount / totalSupply * 100).toFixed(4) : 100;
            return (
              <tr key={i}>
                <td className="rank">{(currentPage - 1) * NUM_PER_PAGE + i + 1}</td>
                <td>
                  <Link to={`/account/${holder.address}`}>{holder.address}</Link>
                </td>
                <td className="rank">{holder.amount}</td>
                <td className="rank">{percent}%</td>
              </tr>);
          })}
        </tbody>
      </table>
      <Pagination
        size={'lg'}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange} />
    </>
  );
}

export default HoldersTable;