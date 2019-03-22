import React from 'react';
import ReactJson from 'react-json-view'
import cx from 'classnames'

export default function JsonView({json, onClose, className}) {
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