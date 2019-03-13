import React from 'react';
import cx from 'classnames';

import Spinner from 'common/components/spinner';

export default function LoadingPanel({ className, ...props }) {
  return (
    <div className={cx("loading-panel", className)} {...props}>
      <Spinner></Spinner>
    </div>);
}
