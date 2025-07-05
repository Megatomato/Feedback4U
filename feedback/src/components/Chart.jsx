import React from 'react';
import { Row, Col, Card } from 'react-bootstrap';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import { sampleData } from '../data/sampleData';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const ChartComponent = ({ type, data, options = {}, title, height = 300 }) => {
  const rosePineColors = [
    '#907aa9', '#56949f', '#ea9d34', '#286983',
    '#b4637a', '#9893a5', '#797593', '#575279'
  ];

  const chartData = {
    ...data,
    datasets: data.datasets.map((dataset, index) => ({
      ...dataset,
      backgroundColor: type === 'doughnut' || type === 'pie'
        ? rosePineColors
        : rosePineColors[index % rosePineColors.length],
      borderColor: rosePineColors[index % rosePineColors.length],
      borderWidth: 2,
      tension: 0.4,
      fill: type === 'line' ? false : true
    }))
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          color: '#575279',
          font: { size: 12 }
        }
      },
      tooltip: {
        backgroundColor: '#faf4ed',
        titleColor: '#575279',
        bodyColor: '#575279',
        borderColor: '#907aa9',
        borderWidth: 1,
      },
    },
    scales: type !== 'doughnut' && type !== 'pie' ? {
      y: {
        beginAtZero: true,
        ticks: { color: '#575279' },
        grid: { color: '#dfdad9' }
      },
      x: {
        ticks: { color: '#575279' },
        grid: { color: '#dfdad9' }
      }
    } : {},
    ...options
  };

  const renderChart = () => {
    switch (type) {
      case 'bar':
        return <Bar data={chartData} options={chartOptions} />;
      case 'line':
        return <Line data={chartData} options={chartOptions} />;
      case 'doughnut':
        return <Doughnut data={chartData} options={chartOptions} />;
      default:
        return <Bar data={chartData} options={chartOptions} />;
    }
  };

  return (
    <Card className="h-100">
      <Card.Header>
        <Card.Title className="mb-0 h6">{title}</Card.Title>
      </Card.Header>
      <Card.Body>
        <div style={{ height }}>
          {renderChart()}
        </div>
      </Card.Body>
    </Card>
  );
};

const AnalyticsChart = () => {
  // Course completion data
  const courseCompletionData = {
    labels: sampleData.courses.map(course => course.name),
    datasets: [{
      label: 'Completion Rate (%)',
      data: sampleData.courses.map(course => course.completionRate)
    }]
  };

  // Assignment submission data
  const submissionData = {
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5'],
    datasets: [{
      label: 'Submissions',
      data: [95, 88, 92, 85, 90],
      fill: false
    }]
  };

  return (
    <Row>
      <Col lg={6} className="mb-4">
        <ChartComponent
          type="bar"
          data={courseCompletionData}
          title="Course Completion Rates"
          options={{
            scales: {
              y: {
                beginAtZero: true,
                max: 100
              }
            }
          }}
        />
      </Col>
      <Col lg={6} className="mb-4">
        <ChartComponent
          type="line"
          data={submissionData}
          title="Weekly Submission Trends"
        />
      </Col>
    </Row>
  );
};

export {ChartComponent, AnalyticsChart};
