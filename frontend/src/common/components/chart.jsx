import React from "react";
import Chart from "chart.js";
import history from 'common/history'
import cx from 'classnames';


const getLineOptions = (type, data, labels, clickType) => {
  return {
    type: type,
    data: {
      datasets: [{
        data: data,
        backgroundColor: "transparent",
        borderColor: '#25c4e4',
        borderWidth: '1',
        pointBackgroundColor: '#1b1f2a'
      }],
      labels: labels
    },
    options: {
      maintainAspectRatio: false,
      responsive: true,
      cutoutPercentage: 75,
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
          },
          gridLines: {
            display: false
          }
        }],
        yAxes: [{
          ticks: {
            maxTicksLimit: 3
          },
          gridLines: {
            display: false
          }
        }]
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
    const options = chartType === 'line' ? getLineOptions(chartType, data, labels, clickType) : this.getInitialOptions(chartType, data, labels, clickType);
    this.chart = new Chart(chartRef, options);
    Chart.defaults.global.defaultFontColor = '#8A8FB5';
    Chart.defaults.global.defaultFontFamily = 'Alwyn';
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
          borderWidth: 0
        }],
        labels: labels
      },
      options: {
        responsive: true,
        cutoutPercentage: 75,
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
          switch (clickType) {
            case 'account':
              var activeElement = this.chart.getElementAtEvent(e);
              if (activeElement.length > 0) {
                const address = this.chart.config.data.labels[activeElement[0]._index];
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



