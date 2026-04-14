const API_URL = 'http://localhost:3001/api';

export const loginUser = async (email, password) => {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error);
  return data;
};

export const signupUser = async (email, password) => {
  const res = await fetch(`${API_URL}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error);
  return data;
};

export const fetchRemoteData = async (token) => {
  const res = await fetch(`${API_URL}/data`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error);
  return data.data;
};

export const saveRemoteData = async (token, syncData) => {
  const res = await fetch(`${API_URL}/data`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` 
    },
    body: JSON.stringify({ data: syncData })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error);
  return data;
};
