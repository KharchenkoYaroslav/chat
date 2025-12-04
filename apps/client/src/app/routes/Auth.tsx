import React, { useState } from 'react';
import axios, { AxiosError } from 'axios';
import styles from '../app.module.scss';

interface AuthProps {
  setLogin: (login: string) => void;
  setToken: (token: string) => void;
  setUserId: (userId: string) => void;
  setCreatedAt: (createdAt: string) => void;
}

const Auth: React.FC<AuthProps> = ({
  setLogin,
  setToken,
  setUserId,
  setCreatedAt,
}) => {
  const [currentLogin, setCurrentLogin] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isRegister, setIsRegister] = useState(false);

  const handleLogin = async () => {
    setError(null);
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/auth/login`,
        {
          login: currentLogin,
          password: currentPassword,
        }
      );

      if (response.data.token) {
        setToken(response.data.token);
        setUserId(response.data.userId);
        setLogin(currentLogin);
        setCreatedAt(response.data.createdAt);
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const axiosError = err as AxiosError<{ message: string }>;
        if (axiosError.response) {
          setError(
            `Login failed: ${
              axiosError.response.data.message || 'Bad request'
            } (Status: ${axiosError.response.status})`
          );
        } else if (axiosError.request) {
          setError('Login failed: No response from server.');
        } else {
          setError('Login failed: An error occurred.');
        }
      } else if (err instanceof Error) {
        setError(err.message);
      }
    }
  };

  const handleRegister = async () => {
    setError(null);
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/auth/register`,
        {
          login: currentLogin,
          password: currentPassword,
        }
      );

      if (response.data.token) {
        setToken(response.data.token);
        setUserId(response.data.userId);
        setLogin(currentLogin);
        setCreatedAt(response.data.createdAt);
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const axiosError = err as AxiosError<{ message: string }>;
        if (axiosError.response) {
          setError(
            `Registration failed: ${
              axiosError.response.data.message || 'Bad request'
            } (Status: ${axiosError.response.status})`
          );
        } else if (axiosError.request) {
          setError('Registration failed: No response from server.');
        } else {
          setError('Registration failed: An error occurred.');
        }
      } else if (err instanceof Error) {
        setError(err.message);
      }
    }
  };

  const handleAuthAction = () => {
    if (isRegister) {
      handleRegister();
    } else {
      handleLogin();
    }
  };

  return (
    <div className={styles.auth}>
      <div>
        <h1>{isRegister ? 'Register' : 'Login'}</h1>
        <div>
          <input
            type="text"
            placeholder="Login"
            value={currentLogin}
            onChange={(e) => setCurrentLogin(e.target.value)}
          />
        </div>
        <div>
          <input
            type="password"
            placeholder="Password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
        </div>
        <div>
          <button onClick={handleAuthAction}>
            {isRegister ? 'Register' : 'Login'}
          </button>
          <button onClick={() => setIsRegister(!isRegister)}>
            {isRegister ? 'Switch to Login' : 'Switch to Register'}
          </button>
        </div>
        <div>{error && <p style={{ color: 'red' }}>{error}</p>}</div>
      </div>
    </div>
  );
};

export default Auth;
