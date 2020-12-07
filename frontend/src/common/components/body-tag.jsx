import React from 'react'

class BodyTag extends React.Component {
  static defaultProps = {
    className: "",
    id: "",
  }
  componentDidMount() {
  	this.updateValues(this.props);
  }
  componentDidUpdate(preProps) {
    this.updateValues(this.props);
  }
  updateValues(props) {
  	let { className, id } = props;
    className && className.length ? document.body.className = className : document.body.className = '';
    id ? document.body.id = id : null;
  }
  componentWillUnmount() {
  	let { className, id } = this.props;
  	id ? document.body.id = null : null;
  	className ? document.body.className = '' : null;
  }
  render() {
    return <React.Fragment />
  }
}

export default BodyTag
