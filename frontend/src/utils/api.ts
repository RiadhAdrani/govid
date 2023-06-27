import axios from 'axios';
import Cookies from 'js-cookie';

// TODO : change with env variable
const useApi = axios.create({ baseURL: 'http://localhost:8080' });

useApi.interceptors.request.use((config) => {
  if (Cookies.get('token')) {
    if (!config.headers.get('Authorization')) {
      config.headers.set('Authorization', `Bearer ${Cookies.get('token')}`);
    }
  }

  return config;
});

export default useApi;
