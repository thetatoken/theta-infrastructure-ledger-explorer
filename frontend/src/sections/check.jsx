import React, { Component } from "react";
import { transactionsService } from 'common/services/transaction';
import { apiService } from '../common/services/api';


export default class Check extends Component {
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
    const address = this.searchAddress.value;
    const startTime = new Date(this.searchStartTime.value).getTime() / 1000;
    console.log(`[test] startTime: ${startTime}`);
    const endTime = new Date(this.searchEndTime.value).getTime() / 1000;
    console.log(`[test] endTime: ${endTime}`);
    apiService.get(`/accountTx/counter/${address}`, { params: { type: 5, startTime, endTime, isEqualType: true } })
      .then(async res => {
        console.log('[test] res in get counter:', res);
        let result = 0;
        const total = res.data.total;
        let counter = 1;
        const time = Math.floor(total / 100);
        const rest = total - time * 100;
        console.log(`total: ${total}, time: ${time}, rest: ${rest}`);
        if (total !== 0) {
          this.setState({ result: 'processing' })
          for (counter; counter < time + 1; counter++) {
            await apiService.get(`accounttx/${address}`, { params: { type: 5, pageNumber: counter, limitNumber: 100, isEqualType: true } })
              .then(res => {
                console.log(counter);
                res.data.body.forEach(tx => {
                  if (!tx.data.source) { console.log(tx) }
                  result += (tx.data.source.coins.tfuelwei - '0') / 1000000000000000000;
                });
              })
          }
          await apiService.get(`accounttx/${address}`, { params: { type: 5, pageNumber: time + 1, limitNumber: rest, isEqualType: true } })
            .then(res => {
              console.log(counter);
              res.data.body.forEach(tx => {
                if (!tx.data.source) { console.log(tx) }
                result += (tx.data.source.coins.tfuelwei - '0') / 1000000000000000000;
              });
            })
          this.setState({ result: result })
        }
      })
  }

  render() {
    return (
      <div className="content check">
        <div className="search">
          <input type="text" className="search-input" placeholder="Address" ref={input => this.searchAddress = input} onKeyPress={e => this.handleEnterKey(e)} />
          <input type="date" id="start" name="trip-start"
            min="2018-01-01" ref={input => this.searchStartTime = input} onKeyPress={e => this.handleEnterKey(e)}></input>
          <input type="date" id="end" name="trip-start"
            min="2018-01-01" ref={input => this.searchEndTime = input} onKeyPress={e => this.handleEnterKey(e)}></input>
        </div>
        <div>Total earned tfuel: {this.state.result}</div>
      </div>
    );
  }
}