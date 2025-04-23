// services/authServices.ts

interface UserRegister {
    username: string;
    email: string;
    password: string;
  }
  
  interface UserLogin {
    email: string;
    password: string;
  }
  
  // Define API response type
  interface ApiResponse<T> {
    success: boolean;
    message?: string;
    data?: T;
  }
  
  // User profile response type
  interface UserProfile {
    id: string;
    username: string;
    email: string;
  }
  
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://stock-project-1.onrender.com';
  
  export class AuthService {
    private static token: string | null = null;
  
    static setToken(token: string): void {
      this.token = token;
      if (typeof window !== 'undefined') {
        localStorage.setItem('token', token);
      }
    }
  
    static getToken(): string | null {
      if (!this.token && typeof window !== 'undefined') {
        this.token = localStorage.getItem('token');
      }
      return this.token;
    }
  
    static removeToken(): void {
      this.token = null;
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
      }
    }
  
    static isAuthenticated(): boolean {
      return !!this.getToken();
    }
  
    static async register(userData: UserRegister): Promise<ApiResponse<UserProfile>> {
      try {
        const response = await fetch(`${API_BASE_URL}/users/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(userData),
        });
  
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || 'Registration failed');
        }
  
        return response.json();
      } catch (error) {
        console.error('Registration error:', error);
        throw error;
      }
    }
  
    static async login(credentials: UserLogin): Promise<ApiResponse<{ access_token: string }>> {
      try {
        const response = await fetch(`${API_BASE_URL}/users/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(credentials),
        });
  
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || 'Login failed');
        }
  
        const data: { access_token: string } = await response.json();
  
        if (data.access_token) {
          this.setToken(data.access_token);
        }
  
        return { success: true, data };
      } catch (error) {
        console.error('Login error:', error);
        throw error;
      }
    }
  
    static logout(): void {
      this.removeToken();
    }
  
    static async getUserProfile(): Promise<ApiResponse<UserProfile>> {
      try {
        const token = this.getToken();
        if (!token) {
          throw new Error('Not authenticated');
        }
  
        const response = await fetch(`${API_BASE_URL}/users/user/me`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
  
        if (!response.ok) {
          if (response.status === 401) {
            this.removeToken();
            throw new Error('Session expired');
          }
          throw new Error('Failed to fetch user profile');
        }
  
        const data: UserProfile = await response.json();
        return { success: true, data };
      } catch (error) {
        console.error('Profile fetch error:', error);
        throw error;
      }
    }
  }
  
  export default AuthService;
  