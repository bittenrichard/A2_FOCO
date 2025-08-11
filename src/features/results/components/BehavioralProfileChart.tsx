// Local: src/features/results/components/BehavioralProfileChart.tsx

import React from 'react';

interface ProfileData {
  executor: number;
  comunicador: number;
  planejador: number;
  analista: number;
}

interface BehavioralProfileChartProps {
  profileData: ProfileData;
}

const BehavioralProfileChart: React.FC<BehavioralProfileChartProps> = ({ profileData }) => {
  const labels = ['Executor', 'Comunicador', 'Planejador', 'Analista'];
  const dataPoints = [
    profileData.executor || 0,
    profileData.comunicador || 0,
    profileData.planejador || 0,
    profileData.analista || 0,
  ];

  const size = 200;
  const center = size / 2;
  const maxScore = 50;

  const points = dataPoints.map((value, i) => {
    const angle = (i / labels.length) * 2 * Math.PI - Math.PI / 2;
    const normalizedValue = Math.max(0, value);
    const x = center + (normalizedValue / maxScore) * center * Math.cos(angle);
    const y = center + (normalizedValue / maxScore) * center * Math.sin(angle);
    return `${x},${y}`;
  }).join(' ');

  const axisPoints = labels.map((_, i) => {
    const angle = (i / labels.length) * 2 * Math.PI - Math.PI / 2;
    const x = center + center * Math.cos(angle);
    const y = center + center * Math.sin(angle);
    return { x, y, label: labels[i] };
  });

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {[0.25, 0.5, 0.75, 1].map((ratio, index) => (
          <polygon
            key={index}
            points={axisPoints.map(p => `${center + (p.x - center) * ratio},${center + (p.y - center) * ratio}`).join(' ')}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="1"
          />
        ))}

        {axisPoints.map((p, i) => (
          <line key={i} x1={center} y1={center} x2={p.x} y2={p.y} stroke="#e5e7eb" strokeWidth="1" />
        ))}

        <polygon points={points} fill="rgba(79, 70, 229, 0.5)" stroke="#4f46e5" strokeWidth="2" />
        
        {points.split(' ').map((point, i) => {
          const [x, y] = point.split(',');
          return <circle key={i} cx={x} cy={y} r="3" fill="#4f46e5" />;
        })}
        
        {axisPoints.map((p, i) => (
            <text
                key={i}
                x={center + (p.x - center) * 1.15}
                y={center + (p.y - center) * 1.15}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize="10"
                fontWeight="bold"
                fill="#4b5563"
            >
                {p.label}
            </text>
        ))}
      </svg>
    </div>
  );
};

export default BehavioralProfileChart;