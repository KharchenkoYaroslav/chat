import React, { useState } from 'react';
import styles from '..//app.module.scss';
import { CgProfile } from 'react-icons/cg';
import Profile from '../components/Profile';
import SearchBox from '../components/SearchBox';
import PersonalChat from '../components/PersonalChat';

interface MessengerProps {
  login: string;
  setLogin: (login: string) => void;
  setToken: (token: string | null) => void;
  token: string | null;
  userId: string | null;
  createdAt: string;
}

const Messenger: React.FC<MessengerProps> = ({
  login,
  setLogin,
  setToken,
  token,
  userId,
  createdAt,
}) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<{ id: string; name: string } | null>(
    null
  );

  const handleProfileToggle = () => {
    setIsProfileOpen(!isProfileOpen);
  };

  const handleSelectPerson = (person: { id: string; name: string }) => {
    setSelectedPerson(person);
  };

  return (
    <div className={styles.messenger}>
      <nav>
        <div className={styles.profileIcon} onClick={handleProfileToggle}>
          <CgProfile size={30} cursor="pointer" />
        </div>
        <SearchBox onSelectPerson={handleSelectPerson} />
        <div className={styles.chatHeader}>
          {selectedPerson
            ? userId === selectedPerson.id
              ? 'My nodes'
              : `Chat with: ${selectedPerson.name}`
            : 'Select a person to chat'}
        </div>
      </nav>
      <Profile
        login={login}
        setLogin={setLogin}
        setToken={setToken}
        token={token}
        userId={userId}
        createdAt={createdAt}
        isProfileOpen={isProfileOpen}
        handleProfileToggle={handleProfileToggle}
      />
      {selectedPerson && userId && token && (
        <PersonalChat
          userId={userId}
          selectedPersonId={selectedPerson.id}
          token={token}
        />
      )}
    </div>
  );
};

export default Messenger;
