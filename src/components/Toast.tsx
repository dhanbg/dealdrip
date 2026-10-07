'use client';

import React, { useEffect, useState } from 'react';
import { useStore } from '@/context/StoreContext';

export function Toast() {
  const { toastMessage } = useStore();
  const [visible, setVisible] = useState(false);
  const [text, setText] = useState('');

  useEffect(() => {
    if (!toastMessage) return;
    setText(toastMessage);
    setVisible(true);

    const timer = setTimeout(() => {
      setVisible(false);
    }, 2700);

    return () => clearTimeout(timer);
  }, [toastMessage]);

  return (
    <div
      className={`toast ${visible ? 'show' : ''}`}
      role="status"
      aria-live="polite"
    >
      {text}
    </div>
  );
}
