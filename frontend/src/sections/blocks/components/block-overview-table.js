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
          <thead>
            <tr>
              <th className="left">Height</th>
              <th className="left">Block Hash</th>
            </tr>
          </thead>
          <tbody>
            {blockInfoList
              .sort((a, b) => b.height - a.height)
              .map(blockInfo => {
                const hash = size === 'full' ? blockInfo.hash : blockInfo.hash.substring(0, 35) + '...';
                return (
                  <tr key={blockInfo.height}>
                    <td className="left">{blockInfo.height}</td>
                    <td className="left"><Link to={`/blocks/${blockInfo.height}`}>{hash}</Link></td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    );
  }
}
