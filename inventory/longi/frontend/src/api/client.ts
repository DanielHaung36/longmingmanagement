import axios from 'axios';

// The base URL is now handled by the Vite proxy.
// All requests will be sent to the current domain, and Vite will forward them.
axios.defaults.baseURL = '/';

export default axios;
