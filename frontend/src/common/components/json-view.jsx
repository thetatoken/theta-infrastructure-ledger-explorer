import React from 'react';
import ReactJson from 'react-json-view'
import cx from 'classnames'
import { getHex } from 'common/helpers/utils';
import { TxnTypes } from 'common/constants'

export default function JsonView({ json, onClose, className }) {
  if (_.get(json, 'type') === TxnTypes.SMART_CONTRACT) {
    if (_.has(json, 'data.data')) json.data.data = getHex(json.data.data);
    if (_.has(json, 'receipt.EvmRet')) json.receipt.EvmRet = getHex(json.receipt.EvmRet);
    if (_.has(json, 'receipt.Logs')) {
      json.receipt.Logs = json.receipt.Logs.map(obj => {
        obj.data = getHex(obj.data)
        return obj;
      })
    }
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