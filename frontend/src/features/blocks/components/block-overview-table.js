import React, { Component } from "react";
import { Link } from "react-router";
// import '../styles.scss';

export default class BlockOverviewTable extends Component {
  render() {
    const { blockInfoList, size } = this.props;
    const className = size === 'full' ? "th-overview-table full" : "th-overview-table"
    return (
      <div className={className}>
        <table>
          <tbody>
            <tr>
              <th className="th-overview-th__left">Height</th>
              <th className="th-overview-th__right">Block Hash</th>
            </tr>
            {blockInfoList
              .sort((a, b) => b.height - a.height)
              .map(blockInfo => {
                return (
                  <tr key={blockInfo.height}>
                    <td>{blockInfo.height}</td>
                    <td><Link to={`/blocks/${blockInfo.height}`}>{blockInfo.hash}</Link></td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    );
  }
}
