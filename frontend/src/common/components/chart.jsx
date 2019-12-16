import React, { Component } from "react";
import Chart from "chart.js";
import { browserHistory, Link } from 'react-router';
import _ from 'lodash';
import cx from 'classnames';

let chart;
const getInitialOptions = (type, data, labels) => {
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
        browserHistory.push(`/stakes`);
      },
      tooltips: {
        callbacks: {
          label: function (tooltipItem, data) {
            const { index, datasetIndex } = tooltipItem;
            var label = data.datasets[datasetIndex].data[index] || '';
            if (label) {
              label += '% ' + data.labels[index];
            }
            return label;
          }
        }
      }
    }
  }
}

export default class ThetaChart extends Component {
  constructor(props) {
    super(props);
    this.thetaChart = React.createRef();
    this.state = {

    };
  }
  static defaultProps = {
    includeDetails: true,
    truncate: 35,
  }
  componentDidMount() {
    const { holders, percentage } = this.props;
    const chartRef = this.thetaChart.current.getContext("2d");

    chart = new Chart(chartRef, getInitialOptions('doughnut', holders, percentage));
  }
  componentWillUpdate(nextProps) {
    if (nextProps.holders !== this.props.holders) {
      this.updateChart(chart, nextProps.holders, nextProps.percentage);
    }
  }
  updateChart(chart, holders, percentage) {
    chart.data.labels = holders;
    chart.data.datasets[0].data = percentage;
    chart.update();
  }
  render() {
    return (
      <div className="chart">
        <canvas ref={this.thetaChart} className="canvas" />
      </div>);
  }
}



