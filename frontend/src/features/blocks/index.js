import React, { Component } from "react";
import { browserHistory } from 'react-router';
import socketClient from 'socket.io-client';
import BlockInfoRows from './components/block-info-rows';
import { blocksService } from '/common/services/block';
import BlockInfoRowsBrief from './components/block-info-rows-brief';
import LinkButton from "common/components/link-button";
import Pagination from "common/components/pagination"
// import './styles.scss';

export default class Blocks extends Component {
  constructor(props) {
    super(props);
    this.state = {
      // backendAddress: this.props.route.backendAddress,
      // backendAddress: "52.53.243.120:9000",
      backendAddress: "localhost:9000",
      // backendAddress: "localhost:3000",
      blockHeight: 0,
      blockInfoList: [],
      currentPageNumber: 1,
      totalPageNumber: 0
    };
    this.receivedBlocksEvent = this.receivedBlocksEvent.bind(this);
    this.handleGetBlocksByPage = this.handleGetBlocksByPage.bind(this);
  }

  componentDidMount() {
    browserHistory.push('/blocks');

    const { backendAddress } = this.state;
    blocksService.getTopBlocks()
      .then(res => {
        this.receivedBlocksEvent(res);
      }).catch(err => {
        console.log(err);
      })
    // Initial the socket
    // this.socket = socketClient(backendAddress);
    // this.socket.on('event', this.onSocketEvent)

  }
  componentWillUnmount() {
    // this.socket.disconnect();
  }
  receivedBlocksEvent(data) {
    console.log(data);
    if (data.data.type == 'block_list') {
      this.setState({
        blockInfoList: data.data.body,
        currentPageNumber: data.data.currentPageNumber,
        totalPageNumber: data.data.totalPageNumber
      })
    }
  }
  handleGetBlocksByPage(pageNumber, type) {
    console.log(pageNumber)
    blocksService.getBlocksByPage(pageNumber)
      .then(res => {
        this.receivedBlocksEvent(res);
        // this.setState({
        //   pageNumber: type === 'Prev' ? pageNumber - 1 : pageNumber + 1,
        // })
      }).catch(err => {
        console.log(err);
      })
  }
  renderPrevPageButton() {
    let { currentPageNumber } = this.state;
    currentPageNumber = Number(currentPageNumber);
    return (
      Number(currentPageNumber) !== 1 ?
        <LinkButton className="th-blocks-button__left" left handleOnClick={() => this.handleGetBlocksByPage(currentPageNumber - 1)}>Prev</LinkButton>
        : <div></div>
    );
  }
  renderNextPageButton() {
    let { currentPageNumber, totalPageNumber } = this.state;
    currentPageNumber = Number(currentPageNumber);
    totalPageNumber = Number(totalPageNumber);
    return (
      currentPageNumber !== totalPageNumber ?
        <LinkButton className="th-blocks-button__right" right handleOnClick={() => this.handleGetBlocksByPage(currentPageNumber + 1)} >Next</LinkButton>
        : <div></div>
    );
  }
  render() {
    const { blockInfoList } = this.state;
    let { currentPageNumber, totalPageNumber } = this.state;
    currentPageNumber = Number(currentPageNumber);
    totalPageNumber = Number(totalPageNumber);
    return (
      <div className="th-blocks">
        {/* {blockInfoList !== undefined ?
          <BlockInfoRows blockInfoList={blockInfoList} /> : <div></div>} */}
        <div className="th-blocks-title">Blocks listing. Page: #{currentPageNumber}</div>
        {blockInfoList !== undefined ?
          <BlockInfoRowsBrief blockInfoList={blockInfoList} size='full' /> : <div></div>}
        <div className="th-blocks-pagination">
          {Number(totalPageNumber) !== 0 ? <Pagination
            size={'lg'}
            totalPages={totalPageNumber}
            currentPage={currentPageNumber}
            callback={this.handleGetBlocksByPage}
          /> : <div></div>}
        </div>
        <div className="th-blocks-button">
          {this.renderPrevPageButton()}
          {this.renderNextPageButton()}
        </div>
      </div>
    );
  }
}