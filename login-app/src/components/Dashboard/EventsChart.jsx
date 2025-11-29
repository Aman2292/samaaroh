import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from 'recharts';

const EventsChart = ({ data }) => {
    const statusData = [
        { name: 'Pending', value: data.byStatus?.pending || 0, color: '#3b82f6' },
        { name: 'Confirmed', value: data.byStatus?.confirmed || 0, color: '#10b981' },
        { name: 'In Progress', value: data.byStatus?.in_progress || 0, color: '#f59e0b' },
        { name: 'Completed', value: data.byStatus?.completed || 0, color: '#8b5cf6' }
    ];

    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-3 rounded-lg shadow-lg border border-slate-200">
                    <p className="font-semibold text-slate-800">{payload[0].payload.name}</p>
                    <p className="text-sm" style={{ color: payload[0].payload.color }}>
                        {payload[0].value} events
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Events by Status</h3>
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={statusData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" stroke="#64748b" />
                    <YAxis stroke="#64748b" />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" fill="#4f46e5" radius={[8, 8, 0, 0]}>
                        {statusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default EventsChart;
