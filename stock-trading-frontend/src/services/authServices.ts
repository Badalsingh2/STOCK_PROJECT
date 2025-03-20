// services/authService.ts

interface UserRegister {
    username: string;
    email: string;
    password: string;
  }
  
  interface UserLogin {
    email: string;
    password: string;
  }
  
  // API base URL - replace with your actual API base URL
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  
  export class AuthService {
    private static token: string | null = null;
  
    // Set token in memory and localStorage
    static setToken(token: string): void {
      this.token = token;
      if (typeof window !== 'undefined') {
        localStorage.setItem('token', token);
      }
    }
  
    // Get token from memory or localStorage
    static getToken(): string | null {
      if (!this.token && typeof window !== 'undefined') {
        this.token = localStorage.getItem('token');
      }
      return this.token;
    }
  
    // Remove token on logout
    static removeToken(): void {
      this.token = null;
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
      }
    }
  
    // Check if user is authenticated
    static isAuthenticated(): boolean {
      return !!this.getToken();
    }
  
    // Register new user
    static async register(userData: UserRegister): Promise<any> {
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
  
        return await response.json();
      } catch (error) {
        console.error('Registration error:', error);
        throw error;
      }
    }
  
    // Login user
    static async login(credentials: UserLogin): Promise<any> {
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
  
        const data = await response.json();
        
        // Assuming the API returns a token
        if (data.access_token) {
          this.setToken(data.access_token);
        }
  
        return data;
      } catch (error) {
        console.error('Login error:', error);
        throw error;
      }
    }
  
    // Logout user
    static logout(): void {
      this.removeToken();
    }
  
    // Get user profile
    static async getUserProfile(): Promise<any> {
      try {
        const token = this.getToken();
        if (!token) {
          throw new Error('Not authenticated');
        }
  
        const response = await fetch(`${API_BASE_URL}/users/user/me`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
  
        if (!response.ok) {
          if (response.status === 401) {
            this.removeToken();
            throw new Error('Session expired');
          }
          throw new Error('Failed to fetch user profile');
        }
  
        return await response.json();
      } catch (error) {
        console.error('Profile fetch error:', error);
        throw error;
      }
    }
  }
  
  export default AuthService;