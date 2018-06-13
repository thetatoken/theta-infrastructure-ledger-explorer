import React, { Component } from "react";
import { browserHistory } from 'react-router';
import { blocksService } from '/common/services/block';
import BlockOverviewTable from './components/block-overview-table';
import Pagination from "common/components/pagination";
// import './styles.scss';

export default class Blocks extends Component {
  constructor(props) {
    super(props);
    this.state = {
      backendAddress: this.props.route.backendAddress,
      // backendAddress: "localhost:9000",
      blockHeight: 0,
      blockInfoList: [],
      currentPageNumber: 0,
      totalPageNumber: 0
    };
    this.receivedBlocksEvent = this.receivedBlocksEvent.bind(this);
    this.handleGetBlocksByPage = this.handleGetBlocksByPage.bind(this);
  }

  componentDidMount() {
    browserHistory.push('/blocks');

    const { currentPageNumber } = this.state;
    blocksService.getBlocksByPage(currentPageNumber)
      .then(res => {
        this.receivedBlocksEvent(res);
      }).catch(err => {
        console.log(err);
      })
  }

  receivedBlocksEvent(data) {
    if (data.data.type == 'block_list') {
      this.setState({
        blockInfoList: data.data.body,
        currentPageNumber: data.data.currentPageNumber,
        totalPageNumber: data.data.totalPageNumber
      })
    }
  }
  handleGetBlocksByPage(pageNumber) {
    blocksService.getBlocksByPage(pageNumber)
      .then(res => {
        this.receivedBlocksEvent(res);
      }).catch(err => {
        console.log(err);
      })
  }
  render() {
    const { blockInfoList } = this.state;
    let { currentPageNumber, totalPageNumber } = this.state;
    currentPageNumber = Number(currentPageNumber);
    totalPageNumber = Number(totalPageNumber);
    return (
      <div className="theta-content__container">
        <div className="theta-content__container--title">Blocks listing. Page: #{currentPageNumber + 1}</div>
        {blockInfoList !== undefined ?
          <BlockOverviewTable blockInfoList={blockInfoList} size='full' /> : <div></div>}
        <div className="theta-content__container--pagination">
          <Pagination
            size={'lg'}
            totalPages={totalPageNumber}
            currentPage={currentPageNumber}
            callback={this.handleGetBlocksByPage}
          />
        </div>
      </div>
    );
  }
}