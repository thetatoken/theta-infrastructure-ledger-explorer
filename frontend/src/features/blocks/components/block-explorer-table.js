import React, { Component } from "react";
import { Link } from "react-router"
import '../styles.scss';

export default class BlockExplorerTable extends Component {
  renderContent(key, content) {
    if (key === 'parent_hash') {
      return (
        <Link to={`/blocks/${Number(this.props.blockInfo.height) - 1}`} >{content}</Link>
      )
    } else
      return content;
  }
  getInfo(blockInfo, key) {
    if (key !== 'txs') return blockInfo[key];
    else if (blockInfo[key] && blockInfo[key][blockInfo[key].length - 1] && blockInfo[key][blockInfo[key].length - 1].outputs)
      return blockInfo[key][blockInfo[key].length - 1].outputs[0].address;
    else if (blockInfo[key] && blockInfo[key][blockInfo[key].length - 1] && blockInfo[key][blockInfo[key].length - 1].data
      && blockInfo[key][blockInfo[key].length - 1].data.outputs)
      return blockInfo[key][blockInfo[key].length - 1].data.outputs[0].address;
    else return 'Wrong Data';
  }
  render() {
    const { blockInfo } = this.props;
    return (
      <div className="th-be-table">
        {Object.keys(blockInfo).map(key => {
          const content = this.getInfo(blockInfo, key);
          return (
            <div className="th-be-table__row" key={key}>
              <div className="th-be-table__row--left">{key}</div>
              <div className="th-be-table__row--right">
                <p className="th-be-table-text">
                  {this.renderContent(key, content)}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    );
  }
}
