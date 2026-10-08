import axios from 'axios'

// One shared axios instance for every API call.
// baseURL '/api' + the Vite proxy = requests reach Django on port 8000.
const api = axios.create({
  baseURL: '/api',
})

// Attach the JWT access token to every request automatically.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// If the access token expired (401), use the refresh token to get a new
// one, then retry the original request. If refreshing fails, log out.
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    const refresh = localStorage.getItem('refresh')

    if (error.response?.status === 401 && refresh && !originalRequest._retry) {
      originalRequest._retry = true
      try {
        // Raw axios on purpose: must not send the expired access token.
        const { data } = await axios.post('/api/auth/refresh/', { refresh })
        localStorage.setItem('access', data.access)
        originalRequest.headers.Authorization = `Bearer ${data.access}`
        return api(originalRequest)
      } catch {
        localStorage.removeItem('access')
        localStorage.removeItem('refresh')
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api
