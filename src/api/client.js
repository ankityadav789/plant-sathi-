export const VITE_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const fetchClient = async (endpoint, options = {}) => {
  const url = `${VITE_API_URL}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'An error occurred while communicating with the server.');
    }

    return data;
  } catch (error) {
    if (error.name === 'TypeError') {
      throw new Error('Network error. Ensure the backend server is running.');
    }
    throw error; // Rethrow parsed error
  }
};
