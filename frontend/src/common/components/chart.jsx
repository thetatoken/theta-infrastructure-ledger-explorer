import React, { Component } from "react";
import Chart from "chart.js";
import { browserHistory, Link } from 'react-router';
import _ from 'lodash';
import cx from 'classnames';

const getInitialOptions = (type, data, labels, clickType) => {
  return {
    type: type,
    data: {
      datasets: [{
        data: data,
        backgroundColor: [
          '#FF5CEA',
          '#8652C9',
          '#017CF8',
          '#0EC1E6',
          '#BAD930',
          '#FFE643',
          '#F7921E',
          '#F1424D',
          '#A5ACB9'
        ],
      }],
      labels: labels
    },
    options: {
      responsive: true,
      cutoutPercentage: 75,
      legend: {
        position: 'top',
      },
      title: {
        display: false,
      },
      legend: {
        display: false,
      },
      animation: {
        animateScale: true,
        animateRotate: true
      },
      onClick: (e) => {
        if (clickType === 'account') {
          var activeElement = chart.getElementAtEvent(e);
          if (activeElement.length > 0) {
            const address = chart.config.data.labels[activeElement[0]._index];
            if (address !== 'Rest Nodes') browserHistory.push(`/account/${address}`);
            return;
          }
        }
        if (clickType === 'stake') {
          browserHistory.push(`/stakes`);
        }
      },
      tooltips: {
        callbacks: {
          label: function (tooltipItem, data) {
            const { index, datasetIndex } = tooltipItem;
            if (type !== 'line') {
              var label = data.datasets[datasetIndex].data[index] || '';
              if (label) {
                label += '% ' + data.labels[index];
              }
              return label;
            } else {
              var label = data.datasets[datasetIndex].data[index] || '';
              if (label) {
                label += ': ' + data.labels[index];
              }
              return label;
            }
          }
        }
      }
    }
  }
}

const getTimes = () => {
  let res = [];
  let now = new Date().getTime();
  for (let i = 0; i < 14; i++) {
    res.push(now - 1000 * 60 * 60 * 24 * i);
  }
  return res;
}
const getLineOptions = (type, data, labels, clickType) => {
  return {
    type: type,
    data: {
      datasets: [{
        data: data,
        backgroundColor: "transparent",
        borderColor: '#29B3EB'
      }],
      labels: labels
    },
    options: {
      responsive: true,
      cutoutPercentage: 75,
      legend: {
        position: 'top',
      },
      title: {
        display: false,
      },
      legend: {
        display: false,
      },
      animation: {
        animateScale: true,
        animateRotate: true
      },
      onClick: (e) => {
        
      },
      tooltips: {
        callbacks: {
          label: function (tooltipItem, data) {
            const { index, datasetIndex } = tooltipItem;
            var label = data.datasets[datasetIndex].data[index] || '';
            // if (label) {
            //   label += ': ' + data.labels[index];
            // }
            return label;
          }
        }
      },
      scales: {
        xAxes: [{
          type: 'time',
          time: {
            unit: 'week'
          }
        }]
      }
    }
  }
}

export default class ThetaChart extends Component {
  constructor(props) {
    super(props);
    this.chart = null;
    this.doughnut = React.createRef();
    this.line = React.createRef();
    this.state = {

    };
  }
  static defaultProps = {
    includeDetails: true,
    truncate: 35,
  }
  componentDidMount() {
    const { chartType, labels, data, clickType } = this.props;
    const chartRef = chartType === 'line' ? this.line.current.getContext("2d") : this.doughnut.current.getContext("2d");
    const options = chartType === 'line' ? getLineOptions(chartType, data, labels, clickType) : getInitialOptions(chartType, data, labels, clickType);
    this.chart = new Chart(chartRef, options);
  }
  componentWillUpdate(nextProps) {
    if (nextProps.labels !== this.props.labels) {
      this.updateChart(this.chart, nextProps.labels, nextProps.data);
    }
  }
  updateChart(chart, labels, data) {
    chart.data.labels = labels;
    chart.data.datasets[0].data = data;
    chart.update();
  }
  render() {
    const { chartType } = this.props;
    return (
      <div className={cx("chart", chartType)}>
        {chartType === 'doughnut' && <canvas ref={this.doughnut} className="canvas doughnut" />}
        {chartType === 'line' && <canvas ref={this.line} className="canvas line" />}
      </div>);
  }
}



