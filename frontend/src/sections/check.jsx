import React from "react";
import { apiService } from '../common/services/api';


export default class Check extends React.Component {
  constructor(props) {
    super(props);
    this.searchAddress = React.createRef();
    this.searchStartTime = React.createRef();
    this.searchEndTime = React.createRef();
    this.handleSearch = this.handleSearch.bind(this);
    this.state = {
      result: 0,
    };
  }
  handleEnterKey(e) {
    if (e.key === 'Enter') {
      this.handleSearch();
    }
  }
  async handleSearch() {
    this.setState({ result: 'processing' })
    const address = this.searchAddress.value;
    const startTime = new Date(this.searchStartTime.value).getTime() / 1000;
    console.log(`[test] startTime: ${startTime}`);
    const endTime = new Date(this.searchEndTime.value).getTime() / 1000;
    console.log(`[test] endTime: ${endTime}`);
    console.log(address === '');
    if (!isNaN(startTime) && !isNaN(endTime)) {
      if (address !== '') {
        apiService.get(`/accountTx/tmp/${address}`, { params: { type: 5, startTime, endTime } })
          .then(res => {
            console.log('res is:', res);
            this.setState({ result: res.data.total })
          })
          .catch(err => {
            console.log('Error in check function:', err);
          })
      } else {
        apiService.get(`/blocks/tmp`, { params: { type: 5, startTime, endTime } })
          .then(res => {
            console.log('res is:', res);
            this.setState({ result: res.data.total })
          })
          .catch(err => {
            console.log('Error in check function:', err);
          })
      }
    } else {
      this.setState({ result: 'Error' })
      console.log(`Wrong time input. StartTime: ${startTime}, endTime: ${endTime}`);
    }
    // apiService.get(`/accountTx/counter/${address}`, { params: { type: 5, startTime, endTime, isEqualType: true } })
    //   .then(async res => {
    //     console.log('[test] res in get counter:', res);
    //     let result = 0;
    //     const total = res.data.total;
    //     let counter = 1;
    //     const time = Math.floor(total / 100);
    //     const rest = total - time * 100;
    //     console.log(`total: ${total}, time: ${time}, rest: ${rest}`);
    //     if (total !== 0) {
    //       this.setState({ result: 'processing' })
    //       for (counter; counter < time + 1; counter++) {
    //         await apiService.get(`accounttx/${address}`, { params: { type: 5, pageNumber: counter, limitNumber: 100, isEqualType: true } })
    //           .then(res => {
    //             console.log(counter);
    //             res.data.body.forEach(tx => {
    //               if (!tx.data.source) { console.log(tx) }
    //               result += (tx.data.source.coins.tfuelwei - '0') / 1000000000000000000;
    //             });
    //           })
    //       }
    //       await apiService.get(`accounttx/${address}`, { params: { type: 5, pageNumber: time + 1, limitNumber: rest, isEqualType: true } })
    //         .then(res => {
    //           console.log(counter);
    //           res.data.body.forEach(tx => {
    //             if (!tx.data.source) { console.log(tx) }
    //             result += (tx.data.source.coins.tfuelwei - '0') / 1000000000000000000;
    //           });
    //         })
    //       this.setState({ result: result })
    //     }
    //   })
  }
  render() {
    return (
      <div className="content check">
        <div className="search">
          <input type="text" className="search-input" placeholder="Address" ref={input => this.searchAddress = input} onKeyPress={e => this.handleEnterKey(e)} />
          <input type="text" className="search-input" placeholder="YYYY-MM-DDTHH:MM:SS" ref={input => this.searchStartTime = input} onKeyPress={e => this.handleEnterKey(e)} />
          <input type="text" className="search-input" placeholder="YYYY-MM-DDTHH:MM:SS" ref={input => this.searchEndTime = input} onKeyPress={e => this.handleEnterKey(e)} />
        </div>
        <div>Date input example: 2019-04-20T00:00:00</div>
        <div>Total earned tfuel: {this.state.result}</div>
      </div>
    );
  }
}