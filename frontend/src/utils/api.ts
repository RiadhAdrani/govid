import axios from 'axios';
import Cookies from 'js-cookie';

// TODO : change with env variable
const useApi = axios.create({ baseURL: 'http://localhost:8080' });

useApi.interceptors.request.use((config) => {
  const token = Cookies.get('token');

  if (token) {
    config.withCredentials = true;
  }

  return config;
});

export default useApi;
