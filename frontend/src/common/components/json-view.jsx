import React from 'react';
import ReactJson from 'react-json-view'
import cx from 'classnames'
import { getHex, decodeLogs } from 'common/helpers/utils';
import { TxnTypes } from 'common/constants';
import get from 'lodash/get';
import has from 'lodash/has';

export default function JsonView({ json, onClose, className, abiMap }) {
  let jsonTmp = JSON.parse(JSON.stringify(json));
  if (get(jsonTmp, 'type') === TxnTypes.SMART_CONTRACT) {
    if (has(jsonTmp, 'data.data')) jsonTmp.data.data = getHex(jsonTmp.data.data);
    if (has(jsonTmp, 'receipt.EvmRet')) {
      let emvRet = jsonTmp.receipt.EvmRet;
      jsonTmp.receipt.EvmRet = {
        text: Buffer.from(emvRet, 'base64').toString(),
        hex: getHex(emvRet)
      }
    }
    if (has(jsonTmp, 'receipt.Logs')) {
      jsonTmp.receipt.Logs = jsonTmp.receipt.Logs.map(obj => {
        obj.data = getHex(obj.data)
        return obj;
      })
    }
    jsonTmp.receipt.Logs = decodeLogs(jsonTmp.receipt.Logs, abiMap);
  }

  return (
    <div className={cx("modal json-view", className)}>
      <button className="modal-close btn tx" onClick={onClose} />
      <div className="modal-content">
        <ReactJson
          src={jsonTmp}
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