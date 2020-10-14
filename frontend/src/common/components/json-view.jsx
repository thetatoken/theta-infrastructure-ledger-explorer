import React from 'react';
import ReactJson from 'react-json-view'
import cx from 'classnames'
import { getHex, decodeLogs } from 'common/helpers/utils';
import { TxnTypes } from 'common/constants';
import get from 'lodash/get';
import has from 'lodash/has';

export default function JsonView({ json, onClose, className, abi }) {
  if (get(json, 'type') === TxnTypes.SMART_CONTRACT) {
    if (has(json, 'data.data')) json.data.data = getHex(json.data.data);
    if (has(json, 'receipt.EvmRet')) json.receipt.EvmRet = getHex(json.receipt.EvmRet);
    if (has(json, 'receipt.Logs')) {
      json.receipt.Logs = json.receipt.Logs.map(obj => {
        obj.data = getHex(obj.data)
        return obj;
      })
    }
    json.receipt.Logs = decodeLogs(json.receipt.Logs, abi);
  }

  return (
    <div className={cx("modal json-view", className)}>
      <button className="modal-close btn tx" onClick={onClose} />
      <div className="modal-content">
        <ReactJson
          src={json}
          theme="ocean"
          collapsed={3}
          displayDataTypes={false}
          displayObjectSize={false}
          indentWidth={2}
          enableClipboard={false}
          iconStyle="circle"
          style={{
            backgroundColor: "#1b1f2a",
          }} />
      </div>
    </div>)
}