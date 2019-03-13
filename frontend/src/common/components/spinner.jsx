import React from 'react';
import cx from 'classnames';

export default function Spinner({ className, ...props }) {
  return (
    <div className={cx("spinner", className)} {...props}></div>);
}