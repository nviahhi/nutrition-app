import React, { useMemo, useState } from 'react';
const PieChart = require('recharts').PieChart;
const Pie = require('recharts').Pie;
const Cell = require('recharts').Cell;
const Tooltip = require('recharts').Tooltip;
const Legend = require('recharts').Legend;
const BarChart = require('recharts').BarChart;
const Bar = require('recharts').Bar;
const XAxis = require('recharts').XAxis;
const YAxis = require('recharts').YAxis;
const LineChart = require('recharts').LineChart;
const Line = require('recharts').Line;
const CartesianGrid = require('recharts').CartesianGrid;
import { MealEntry, Review, DailyReview } from '../types';
import { getStatusKey } from '../utils/statusUtils';


interface AnalyticsDashboardProps {
  entries: MealEntry[];
  reviews: Record<number, Review>;
  dailyReviews: DailyReview[];
}

type Period = 'all' | 'week' | 'month';

const COLORS = ['#28a745', '#ffc107', '#6c757d'];


export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ entries, reviews, dailyReviews }) => {

  const [period, setPeriod] = useState<Period>('week');

  const getStartDate = (period: Period): Date => {
    const now = new Date();
    switch (period) {
      case 'week': {
        const date = new Date(now);
        date.setDate(date.getDate() - 7);
        return date;
      }
      case 'month': {
        const date = new Date(now);
        date.setMonth(date.getMonth() - 1);
        return date;
      }
      default:
        return new Date(0); 
    }
  };

  const startDate = getStartDate(period);
  const endDate = new Date();

  const getTotalDaysInPeriod = (start: Date, end: Date): number => {
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getTotalDaysAllTime = (entries: MealEntry[]): number => {
    if (entries.length === 0) return 0;

    const firstDate = new Date(Math.min(...entries.map(e => new Date(e.dateTime).getTime())));
    const today = new Date();
    
    const diffTime = today.getTime() - firstDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 1;
  };

  const filteredEntries = useMemo(() => {
    if (period === 'all') return entries;
    return entries.filter(e => new Date(e.dateTime) >= startDate);
  }, [entries, startDate, period]);

  const filteredDailyReviews = useMemo(() => {
    if (period === 'all') return dailyReviews;
    return dailyReviews.filter(r => new Date(r.date) >= startDate);
  }, [dailyReviews, startDate, period]);

  const goodDays = filteredDailyReviews.filter(r => {
    const status = getStatusKey(r.dateStatus);
    return status === 'good';
  }).length;

  const totalDaysInPeriod = period === 'all' 
    ? getTotalDaysAllTime(entries) 
    : getTotalDaysInPeriod(startDate, endDate);

  const goodDaysPercent = totalDaysInPeriod > 0 
    ? Math.round((goodDays / totalDaysInPeriod) * 100) 
    : 0;

  const stats = useMemo(() => {
    const total = filteredEntries.length;

    const goodCount = filteredEntries.filter(e => {
      const review = reviews[e.id!];
      return review && getStatusKey(review.mealStatus) === 'good';
    }).length;

    const attentionCount = filteredEntries.filter(e => {
      const review = reviews[e.id!];
      return review && getStatusKey(review.mealStatus) === 'attention';
    }).length;

    return {
      total,
      goodCount,
      attentionCount,
      noReviewCount: total - goodCount - attentionCount,
      goodPercent: total > 0 ? Math.round((goodCount / total) * 100) : 0,
    };
  }, [filteredEntries, reviews]);

  const pieData = useMemo(() => [
    { name: '✅ Good', value: stats.goodCount },
    { name: '⚠️ Attention', value: stats.attentionCount },
    { name: 'Not rated', value: stats.noReviewCount },
  ], [stats]);

  const monthlyData = useMemo(() => {
    const monthMap: Record<string, { total: number; good: number }> = {};

    filteredEntries.forEach(e => {
      const date = new Date(e.dateTime);
      const monthKey = date.toLocaleString('default', { month: 'short', year: 'numeric' });

      if (!monthMap[monthKey]) {
        monthMap[monthKey] = { total: 0, good: 0 };
      }
      monthMap[monthKey].total++;

      const review = reviews[e.id!];
      if (review && getStatusKey(review.mealStatus) === 'good') {
        monthMap[monthKey].good++;
      }
    });

    const sortedMonths = Object.entries(monthMap)
      .sort((a, b) => {
        const dateA = new Date(a[0]);
        const dateB = new Date(b[0]);
        return dateA.getTime() - dateB.getTime();
      })
      .map(([month, data]) => ({
        month,
        total: data.total,
        good: data.good,
      }));

    return sortedMonths.slice(-3);
  }, [filteredEntries, reviews]);

  const chartData = useMemo(() => {
    if (period === 'all' || period === 'month') {

      const monthMap: Record<string, { total: number; good: number }> = {};
      
      filteredEntries.forEach(e => {
        const date = new Date(e.dateTime);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (!monthMap[key]) monthMap[key] = { total: 0, good: 0 };
        monthMap[key].total++;
        
        const review = reviews[e.id!];
        if (review && getStatusKey(review.mealStatus) === 'good') {
          monthMap[key].good++;
        }
      });

      return Object.entries(monthMap)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([key, data]) => ({
          label: key,
          total: data.total,
          good: data.good,
        }));
    }

    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const today = new Date();
    const dayOfWeek = today.getDay();

    return days.map((day, index) => {
      const date = new Date(today);
      const diff = (dayOfWeek === 0 ? 7 : dayOfWeek) - (index + 1);
      date.setDate(date.getDate() - diff);

      const dayEntries = filteredEntries.filter(e => {
        const entryDate = new Date(e.dateTime);
        return entryDate.toDateString() === date.toDateString();
      });

      const good = dayEntries.filter(e => {
        const review = reviews[e.id!];
        return review && getStatusKey(review.mealStatus) === 'good';
      }).length;

      return {
        label: day,
        total: dayEntries.length,
        good,
      };
    });
  }, [filteredEntries, reviews, period]);

  
  const hourlyData = useMemo(() => {
    const hours: Record<number, number> = {};
    for (let i = 0; i < 24; i++) hours[i] = 0;

    filteredEntries.forEach(e => {
      const hour = new Date(e.dateTime).getHours();
      hours[hour] = (hours[hour] || 0) + 1;
    });

    return Object.entries(hours)
      .filter(([_, value]) => value > 0)
      .map(([key, value]) => ({
        hour: `${key}:00`,
        count: value,
      }));
  }, [filteredEntries]);

  if (filteredEntries.length === 0) {
    return (
      <div style={{
        padding: '40px',
        textAlign: 'center',
        color: '#888',
        backgroundColor: '#f8f9fa',
        borderRadius: '12px',
      }}>
        <p>📊 No data</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        <button
          onClick={() => setPeriod('all')}
          style={{
            padding: '6px 16px',
            backgroundColor: period === 'all' ? '#1976d2' : '#e9ecef',
            color: period === 'all' ? 'white' : '#333',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
          }}
        >
          All time
        </button>
        <button
          onClick={() => setPeriod('month')}
          style={{
            padding: '6px 16px',
            backgroundColor: period === 'month' ? '#1976d2' : '#e9ecef',
            color: period === 'month' ? 'white' : '#333',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
          }}
        >
          Month
        </button>
        <button
          onClick={() => setPeriod('week')}
          style={{
            padding: '6px 16px',
            backgroundColor: period === 'week' ? '#1976d2' : '#e9ecef',
            color: period === 'week' ? 'white' : '#333',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
          }}
        >
          Last 7 days
        </button>
      </div>      
      <h2 style={{ marginBottom: '20px' }}>📊 Charts</h2>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '16px',
        marginBottom: '30px',
      }}>
        <div style={{ backgroundColor: '#e3f2fd', padding: '16px', borderRadius: '12px', textAlign: 'center' }}>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#1976d2' }}>{filteredEntries.length}</div>
          <div style={{ fontSize: '14px', color: '#555' }}>Total</div>
        </div>
        <div style={{ backgroundColor: '#e8f5e9', padding: '16px', borderRadius: '12px', textAlign: 'center' }}>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#2e7d32' }}>{stats.goodCount}</div>
          <div style={{ fontSize: '14px', color: '#555' }}>✅ Good</div>
        </div>
        <div style={{ backgroundColor: '#fff3e0', padding: '16px', borderRadius: '12px', textAlign: 'center' }}>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#e65100' }}>{stats.attentionCount}</div>
          <div style={{ fontSize: '14px', color: '#555' }}>⚠️ Attention</div>
        </div>
        <div style={{ backgroundColor: '#f3e5f5', padding: '16px', borderRadius: '12px', textAlign: 'center' }}>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#7b1fa2' }}>
            {stats.total > 0 
              ? Math.round((stats.goodCount / stats.total) * 100) 
              : 0}%
          </div>
          <div style={{ fontSize: '14px', color: '#555' }}>% good</div>
        </div>
        <div style={{ backgroundColor: '#e8f5e9', padding: '16px', borderRadius: '12px', textAlign: 'center' }}>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#2e7d32' }}>
            {goodDaysPercent}%
          </div>
          <div style={{ fontSize: '14px', color: '#555' }}>Good days</div>
        </div>        
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '24px',
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '16px',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        }}>
          <h4 style={{ marginTop: 0, marginBottom: '12px' }}>⭐ Rating Distribution</h4>
          {pieData.some(d => d.value > 0) ? (
            <PieChart width={300} height={250}>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }: { name: string; percent: number }) => 
                  `${name}: ${(percent * 100).toFixed(0)}%`
                }
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          ) : (
            <p style={{ color: '#888' }}>No rates</p>
          )}
        </div>

        <div style={{
          backgroundColor: 'white',
          padding: '16px',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        }}>
          <h4 style={{ marginTop: 0, marginBottom: '12px' }}>⏰ Meal Times by Hour</h4>
          {hourlyData.length > 0 ? (
            <BarChart width={300} height={250} data={hourlyData}>
              <XAxis dataKey="hour" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#2196f3" />
            </BarChart>
          ) : (
            <p style={{ color: '#888' }}>No data</p>
          )}
        </div>

        {chartData.length > 0 && period == 'week' && (
          <div style={{
            backgroundColor: 'white',
            padding: '16px',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          }}>
            <h4 style={{ marginTop: 0, marginBottom: '12px' }}>
              📈 Weekly Trend for current week
            </h4>
            <LineChart
              width={chartData.length * 40 + 40}
              height={300}
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis allowDecimals={false} domain={[0, 'auto']} />
              <Tooltip
                contentStyle={{ backgroundColor: 'white', borderRadius: '8px', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
                labelStyle={{ fontWeight: 'bold' }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="total"
                stroke="#1976d2"
                strokeWidth={2.5}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
                name="Total"
              />
              <Line
                type="monotone"
                dataKey="good"
                stroke="#28a745"
                strokeWidth={2.5}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
                name="Good"
              />
            </LineChart>
          </div>
        )}

        {monthlyData.length > 0 && period == 'all' && (
        <div style={{
          backgroundColor: 'white',
          padding: '16px',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
        }}>
          <h4 style={{ marginTop: 0, marginBottom: '12px' }}>📊 Monthly Overview</h4>
          <BarChart
            width={Math.max(monthlyData.length * 80, 300)}
            height={300}
            data={monthlyData}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis allowDecimals={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'white',
                borderRadius: '8px',
                border: 'none',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              }}
              labelStyle={{ fontWeight: 'bold' }}
            />
            <Legend />
            <Bar dataKey="total" fill="#1976d2" name="Total" radius={[4, 4, 0, 0]} />
            <Bar dataKey="good" fill="#28a745" name="Good" radius={[4, 4, 0, 0]} />
          </BarChart>
        </div>
      )}

      </div>
    </div>
  );
};