import React from 'react';
import cx from 'classnames';

const DashboardDetail = ({ title, value }) => {
  return (
    <div className="detail">
      <div className="title">{title}</div>
      <div className={cx("value", { price: title.includes('PRICE') })}>{value}</div>
    </div>
  );
}

export default DashboardDetail;