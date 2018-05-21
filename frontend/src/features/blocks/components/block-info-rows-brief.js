import React, { Component } from "react";
import { Link } from "react-router"
// import '../styles.scss';

export default class BlockInfoRowsBrief extends Component {
  render() {
    const { blockInfoList } = this.props;

    return (
      <div>
        <table className="tableContainer" cellSpacing="10px" >
          <tbody>
            <tr>
              <th width='200'>Block Height</th>
              <th width='300'>Block Hash</th>
            </tr>
            {blockInfoList
              .sort((a, b) => b.height - a.height)
              .map(blockInfo => {
                return (
                  <tr key={blockInfo.height}>
                    <td width='200'>{blockInfo.height}</td>
                    <td width='300'><Link to={`/blocks/${blockInfo.height}`}>{blockInfo.hash}</Link></td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    );
  }
}
