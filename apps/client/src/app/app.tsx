import { Route, Routes, useNavigate } from 'react-router-dom';
import useLocalStorage from './components/useLocalStorage';
import { useEffect } from 'react';
import Auth from './routes/Auth';
import Messenger from './routes/Messenger';
import axios from 'axios';
import styles from './app.module.scss';

export function App() {
  const [login, setLogin] = useLocalStorage('login', '');
  const [token, setToken] = useLocalStorage<string | null>('token', null);
  const [userId, setUserId] = useLocalStorage<string | null>('userId', null);
  const [createdAt, setCreatedAt] = useLocalStorage('createdAt', '');
  const navigate = useNavigate();

  useEffect(() => {
    const verifyToken = async () => {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/auth/verify-token?token=${token}`
      );
      if (response.data.valid) {
        navigate('/');
      } else {
        navigate('/auth');
      }
    };

    verifyToken();
  }, [token, navigate]);

  return (
    <div className={styles.app}>
      <Routes>
        <Route
          path="/auth"
          element={
            <Auth
              setLogin={setLogin}
              setToken={setToken}
              setUserId={setUserId}
              setCreatedAt={setCreatedAt}
            />
          }
        />
        <Route
          path="/"
          element={
            <Messenger
              login={login}
              setLogin={setLogin}
              setToken={setToken}
              token={token}
              userId={userId}
              createdAt={createdAt}
            />
          }
        />
      </Routes>
    </div>
  );
}

export default App;
