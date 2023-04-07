import React from "react";
import { Link } from "react-router-dom";
import socketClient from 'socket.io-client';
import history from 'common/history'
import cx from 'classnames';
import config from '../../config.js'

import { totalTfuelBurnt, hash, age, date } from 'common/helpers/blocks';
import { ChainType } from 'common/constants';

export default class BlockOverviewTable extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      backendAddress: this.props.backendAddress,
      blockHeight: 0,
      blocks: []
    };
    this.onSocketEvent = this.onSocketEvent.bind(this);
  }
  static defaultProps = {
    includeDetails: true,
    truncate: 35,
  }
  static getDerivedStateFromProps(nextProps, prevState) {
    if (nextProps.blocks && nextProps.blocks.length && nextProps.blocks !== prevState.blocks) {
      return { blocks: nextProps.blocks };
    }
    return prevState;
  }
  componentDidMount() {
    const { backendAddress } = this.state;
    const { updateLive } = this.props;

    // Initial the socket
    if (updateLive && backendAddress) {
      window.addEventListener("focus", this.onFocus);
      window.addEventListener("blur", this.onBlur);
      // Calls onFocus when the window first loads
      this.onFocus();
    }
  }
  componentWillUnmount() {
    if (this.socket)
      this.socket.disconnect();
    window.removeEventListener("focus", this.onFocus);
    window.removeEventListener("blur", this.onBlur);
  }
  onSocketEvent(data) {
    if (data.type == 'block_list') {
      this.setState({ blocks: data.body })
    }
  }

  handleRowClick = (height) => {
    history.push(`/blocks/${height}`);
  }

  // User has switched back to the tab
  onFocus = () => {
    if (this.socket) return;

    const { backendAddress } = this.state;
    this.socket = socketClient(backendAddress);
    this.socket.on('PUSH_TOP_BLOCKS', this.onSocketEvent)
  };

  // User has switched away from the tab (AKA tab is hidden)
  onBlur = () => {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  };

  render() {
    const { className, includeDetails, truncate } = this.props;
    const { blocks } = this.state;
    return (
      <table className={cx("data block-table", className)}>
        <thead>
          <tr>
            <th className="height">Height</th>
            <th className="hash">Block Hash</th>
            {includeDetails &&
              <React.Fragment>
                <th className="age">Age</th>
                <th className="fee">{config.chainType === ChainType.SUBCHAIN ? 'vTFUEL BURNT' : 'TFUEL BURNT'}</th>
              </React.Fragment>}
            <th className="txns ">Txns</th>
          </tr>
        </thead>
        <tbody>
          {blocks
            .sort((a, b) => b.height - a.height)
            .map(b => {
              return (
                <tr key={b.height}>
                  <td className="height">{b.height}</td>
                  <td className="hash overflow"><Link to={`/blocks/${b.height}`}>{hash(b, truncate ? truncate : undefined)}</Link></td>
                  {includeDetails &&
                    <React.Fragment>
                      <td className="age" title={date(b)}>{age(b)}</td>
                      <td className="fee"><div className="currency tfuel">{totalTfuelBurnt(b)}</div></td>
                    </React.Fragment>}
                  <td className="txns">{b.num_txs}</td>
                </tr>
              );
            })}
        </tbody>
      </table>);
  }
}
