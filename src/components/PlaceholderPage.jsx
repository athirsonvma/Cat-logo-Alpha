import React from 'react';
import { Construction } from 'lucide-react';

export default function PlaceholderPage({ title, description }) {
  return (
    <div className="empty-state">
      <Construction size={32} strokeWidth={1.3} />
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}
