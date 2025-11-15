
import React from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import type { DashboardData, Chart } from '../types';

interface DashboardProps {
  data: DashboardData;
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE', '#00C49F', '#FFBB28'];

const renderChart = (chart: Chart) => {
  const { type, title, data, dataKey, categoryKey } = chart;
  
  return (
    <div key={title} className="bg-gray-800 p-4 rounded-lg shadow-lg">
      <h3 className="text-lg font-semibold text-white mb-4 text-center">{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        {type === 'bar' && (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#4a5568" />
            <XAxis dataKey={categoryKey} stroke="#a0aec0" />
            <YAxis stroke="#a0aec0" />
            <Tooltip
              contentStyle={{ backgroundColor: '#2d3748', border: '1px solid #4a5568' }}
              labelStyle={{ color: '#e2e8f0' }}
            />
            <Legend />
            <Bar dataKey={dataKey} fill="#8884d8" />
          </BarChart>
        )}
        {type === 'line' && (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#4a5568" />
            <XAxis dataKey={categoryKey} stroke="#a0aec0" />
            <YAxis stroke="#a0aec0" />
            <Tooltip
              contentStyle={{ backgroundColor: '#2d3748', border: '1px solid #4a5568' }}
              labelStyle={{ color: '#e2e8f0' }}
            />
            <Legend />
            <Line type="monotone" dataKey={dataKey} stroke="#82ca9d" />
          </LineChart>
        )}
        {type === 'pie' && (
          <PieChart>
            <Pie data={data} dataKey={dataKey} nameKey={categoryKey} cx="50%" cy="50%" outerRadius={100} fill="#8884d8" label>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ backgroundColor: '#2d3748', border: '1px solid #4a5568' }}
            />
            <Legend />
          </PieChart>
        )}
      </ResponsiveContainer>
    </div>
  );
};


export const Dashboard: React.FC<DashboardProps> = ({ data }) => {
  if (!data || data.charts.length === 0) return null;

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-bold text-white mb-4">Dashboard</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {data.charts.map(renderChart)}
      </div>
    </div>
  );
};
