import React, { useState } from 'react';
import axios, { AxiosError } from 'axios';
import styles from '../app.module.scss';
import { IoClose } from 'react-icons/io5';
import { MdEdit } from 'react-icons/md';
import { MdOutlinePassword } from 'react-icons/md';

interface ProfileProps {
  login: string;
  setLogin: (login: string) => void;
  setToken: (token: string | null) => void;
  token: string | null;
  userId: string | null;
  createdAt: string;
  isProfileOpen: boolean;
  handleProfileToggle: () => void;
}

const Profile: React.FC<ProfileProps> = ({
  login,
  setLogin,
  setToken,
  token,
  userId,
  createdAt,
  isProfileOpen,
  handleProfileToggle,
}) => {
  const [error, setError] = useState<string | null>(null);

  const handleChangeLogin = async (
    newLogin: string,
    token: string,
    setLogin: (login: string) => void
  ) => {
    setError(null);
    try {
      await axios.patch(
        `${import.meta.env.VITE_API_URL}/auth/change-login`,
        {
          newLogin: newLogin,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      alert('Login changed successfully!');
      setLogin(newLogin);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const axiosError = err as AxiosError<{ message: string }>;
        if (axiosError.response) {
          setError(
            `Login change failed: ${
              axiosError.response.data.message || 'Bad request'
            } (Status: ${axiosError.response.status})`
          );
        } else if (axiosError.request) {
          setError('Login change failed: No response from server.');
        } else {
          setError('Login change failed: An error occurred.');
        }
      } else if (err instanceof Error) {
        setError(err.message);
      }
    }
  };

  const handleChangePassword = async (currentPassword: string, newPassword: string, token: string) => {
    setError(null);
    try {
      await axios.patch(
        `${import.meta.env.VITE_API_URL}/auth/change-password`,
        {
          currentPassword: currentPassword,
          newPassword: newPassword,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      alert('Password changed successfully!');
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const axiosError = err as AxiosError<{ message: string }>;
        if (axiosError.response) {
          setError(
            `Password change failed: ${
              axiosError.response.data.message || 'Bad request'
            } (Status: ${axiosError.response.status})`
          );
        } else if (axiosError.request) {
          setError('Password change failed: No response from server.');
        } else {
          setError('Password change failed: An error occurred.');
        }
      } else if (err instanceof Error) {
        setError(err.message);
      }
    }
  };

  const handleDeleteAccount = async (token: string) => {
    setError(null);
    try {
      await axios.delete(
        `${import.meta.env.VITE_API_URL}/auth/delete-account`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      alert('Account deleted successfully!');
      setToken(null);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const axiosError = err as AxiosError<{ message: string }>;
        if (axiosError.response) {
          setError(
            `Account deletion failed: ${
              axiosError.response.data.message || 'Bad request'
            } (Status: ${axiosError.response.status})`
          );
        } else if (axiosError.request) {
          setError('Account deletion failed: No response from server.');
        } else {
          setError('Account deletion failed: An error occurred.');
        }
      } else if (err instanceof Error) {
        setError(err.message);
      }
    }
  };

  return (
    <div
      className={`${styles.profile} ${isProfileOpen ? '' : styles.hidden}`}
    >
      <div className={styles.profileContent}>
        <IoClose className={styles.close} onClick={handleProfileToggle} />
        <p>
          <strong>Login:</strong>&nbsp;{login}
          <MdEdit
            className={styles.Icon}
            onClick={() => {
              const newLoginPrompt = prompt('Enter new login:');
              if (newLoginPrompt && token) {
                handleChangeLogin(newLoginPrompt, token, setLogin);
              }
            }}
          />
          <MdOutlinePassword
            className={styles.Icon}
            onClick={() => {
              const currentPasswordPrompt = prompt('Enter current Password:');
              const newPasswordPrompt = prompt('Enter new Password:');
              if (currentPasswordPrompt && newPasswordPrompt && token) {
                handleChangePassword(currentPasswordPrompt, newPasswordPrompt, token);
              }
            }}
          />
        </p>
        <p>
          <strong>User ID:</strong>&nbsp;{userId}
        </p>
        <p>
          <strong>Account Created:</strong>&nbsp;{createdAt}
        </p>

        {error && <p className={styles.error}>{error}</p>}

        <button
          className={styles.redButton}
          onClick={() => {
            setToken(null);
          }}
        >
          Logout
        </button>
        <button
          className={styles.redButton}
          onClick={() => {
            if (
              token &&
              window.confirm('Are you sure you want to delete your account?')
            ) {
              handleDeleteAccount(token);
            }
          }}
        >
          Delete Account
        </button>
      </div>
    </div>
  );
};

export default Profile;
