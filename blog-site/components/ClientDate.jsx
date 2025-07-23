'use client';
import { useState, useEffect } from 'react';

// Default format function (en-US, short month, day, year)
const defaultFormat = (date) =>
  date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

export default function ClientDate({ date, format = defaultFormat }) {
  const [dateString, setDateString] = useState(null);

  useEffect(() => {
    if (!date) return;
    const d = new Date(date);
    setDateString(format(d));
  }, [date, format]);

  if (dateString === null) return null; // Render nothing on the server

  return <span>{dateString}</span>;
} 