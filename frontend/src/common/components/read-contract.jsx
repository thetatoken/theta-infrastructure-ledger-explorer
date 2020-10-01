import React, { useRef } from "react";

export default class SmartContractCode extends React.PureComponent {
  constructor(props) {
    super(props)
  }
  render(){
    console.log('read contract')
    return(<div>Read Contract</div>)
  }
}