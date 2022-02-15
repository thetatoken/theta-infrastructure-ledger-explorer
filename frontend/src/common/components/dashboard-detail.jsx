import React from 'react';
import cx from 'classnames';

const DashboardDetail = ({ title, value, className, tooltipText }) => {
  return (
    <div className="detail">
      <div className="title">{title}</div>
      <div className={cx("value", className, { price: title.includes('PRICE') })}>
        {tooltipText}
        {value}
      </div>
    </div>
  );
}

export default DashboardDetail;