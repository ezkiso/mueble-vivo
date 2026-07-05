'use client';

import { useEffect, useState } from 'react';

export function useAdminSession() {
  const [csrfToken, setCsrfToken] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/session')
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => {
        setCsrfToken(data.csrfToken);
        setUsername(data.username);
      })
      .catch(() => {
        window.location.href = '/admin/login';
      });
  }, []);

  return { csrfToken, username };
}
