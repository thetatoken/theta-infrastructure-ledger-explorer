import React from "react";
import Chart from 'chart.js/auto';
import 'chartjs-adapter-moment';
import history from 'common/history'
import cx from 'classnames';
import config from "../../config";
import { ChainType } from 'common/constants';

const host = window.location.host;
const isMetaChain = host.match(/metachain-explorer/gi) !== null;
const isMainChain = config.chainType === ChainType.MAINCHAIN;

const getLineOptions = (type, data, labels, ctx) => {
  let gradient = ctx.createLinearGradient(0, 0, 0, 110);
  gradient.addColorStop(0, 'rgba(37,196,228,.25)');
  gradient.addColorStop(1, 'rgba(37,196,228,0)');
  const timeOpt = (isMetaChain || isMainChain) ? {
    unit: 'quarter',
    displayFormats: {
      quarter: 'MMM YYYY'
    }
  } : { unit: 'week' }
  const ticksOpt = (isMetaChain || isMainChain) ? { maxTicksLimit: 3 } : { source: 'auto' }
  const pointRadius = (isMetaChain || isMainChain) ? 0 : 2;
  return {
    type: type,
    data: {
      datasets: [{
        data: data,
        borderColor: '#25c4e4',
        borderWidth: 1,
        pointBackgroundColor: 'rgba(37,196,228,.75)',
        fill: 'start',
        backgroundColor: gradient,
        // radius: 0
      }],
      labels: labels,
    },
    options: {
      maintainAspectRatio: false,
      responsive: true,
      cutoutPercentage: 75,
      plugins: {
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
      },
      elements: {
        line: {
          tension: 0.4
        },
        point: {
          radius: pointRadius,
          borderWidth: 0
        }
      },
      onClick: (e) => {

      },
      scales: {
        x: {
          type: 'time',
          time: timeOpt,
          ticks: ticksOpt,
          gridLines: {
            display: false
          }
        },
        y: {
          ticks: {
            maxTicksLimit: 3
          },
          gridLines: {
            display: false
          }
        }
      }
    }
  }
}

export default class ThetaChart extends React.PureComponent {
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
    const options = chartType === 'line' ? getLineOptions(chartType, data, labels, chartRef) : this.getInitialOptions(chartType, data, labels, clickType);
    this.chart = new Chart(chartRef, options);
    // Chart.defaults.global.defaultFontColor = '#8A8FB5';
    // Chart.defaults.global.defaultFontFamily = 'Alwyn';
  }
  componentDidUpdate(preProps) {
    if (preProps.labels !== this.props.labels) {
      this.updateChart(this.chart, this.props.labels, this.props.data);
    }
  }
  getInitialOptions = (type, data, labels, clickType) => {
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
          borderWidth: 0,
          cutout: '75%'
        }],
        labels: labels
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        aspectRatio: 1,
        plugins: {
          title: {
            display: false,
          },
          legend: {
            display: false,
          },
          tooltip: {
            callbacks: {
              label: function (tooltipItem, data) {
                const { dataIndex, label, dataset } = tooltipItem;
                if (type !== 'line') {
                  var newLabel = dataset.data[dataIndex] || '';
                  if (newLabel) {
                    newLabel += '% ' + label;
                  }
                  return newLabel;
                } else {
                  var newLabel = dataset.data[dataIndex] || '';
                  if (newLabel) {
                    newLabel += ': ' + label;
                  }
                  return newLabel;
                }
              }
            }
          }
        },

        animation: {
          animateScale: true,
          animateRotate: true
        },
        onClick: (e) => {
          switch (clickType) {
            case 'account':
              var activeElement = this.chart.getElementsAtEventForMode(e, 'nearest', { intersect: true }, false);
              if (activeElement.length > 0) {
                const address = this.chart.config.data.labels[activeElement[0].index];
                if (address !== 'Rest Nodes') history.push(`/account/${address}`);
              }
              break;
            case 'stake':
              history.push(`/stakes`);
              break;
            case 'tfuelStake':
              history.push('stakes/tfuel')
            default:
              break;
          }
        },
      }
    }
  }
  updateChart(chart, labels, data) {
    chart.data.labels = labels;
    chart.data.datasets[0].data = data;
    chart.update();
  }
  render() {
    const { chartType, labels, data } = this.props;
    return (
      <div className={cx("chart", chartType)}>
        {chartType === 'doughnut' && <canvas ref={this.doughnut} className="canvas doughnut" />}
        {chartType === 'line' && <canvas ref={this.line} className="canvas line" />}
      </div>);
  }
}



