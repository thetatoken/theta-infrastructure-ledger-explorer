import React, { Component } from "react";
import { Link } from "react-router"
// import '../styles.scss';

export default class BlockInfoRowsBrief extends Component {
  render() {
    const { blockInfoList, size } = this.props;
    const className = size === 'full' ? "th-block-info-brief full" : "th-block-info-brief"
    return (
      <div className={className}>
        <table>
          <tbody>
            <tr>
              <th>Block Height</th>
              <th>Block Hash</th>
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
