import axios from "axios";

const BASE = process.env.REACT_APP_BACKEND_BASE_URL;

const api = axios.create({ baseURL: BASE });

api.interceptors.request.use((config) => {
    const token = localStorage.getItem("adminToken");
    if (token) config.headers.Authorization = token;
    return config;
});

api.interceptors.response.use(
    (res) => res,
    (err) => {
        if (err.response?.status === 401 || err.response?.status === 403) {
            localStorage.removeItem("adminToken");
            localStorage.removeItem("adminUser");
            window.location.href = "/login";
        }
        return Promise.reject(err);
    }
);

export default api;
