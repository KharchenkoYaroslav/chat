import React, { useState, useRef, useEffect } from 'react';
import axios, { AxiosError } from 'axios';
import styles from '../app.module.scss';


interface SearchBoxProps {
  onSelectPerson: (person: { id: string; name: string }) => void;
}

const SearchBox: React.FC<SearchBoxProps> = ({ onSelectPerson }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<{ id: string; name: string }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const searchBoxRef = useRef<HTMLDivElement>(null);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handleSearch = async () => {
    setError(null);
    if (!searchTerm) {
      setSearchResults([]);
      return;
    }
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/messenger/find-person`,
        {
          params: {
            name: searchTerm,
          },
        }
      );

      setSearchResults(response.data.persons || []);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const axiosError = err as AxiosError<{ message: string }>;
        if (axiosError.response) {
          setError(
            `Search failed: ${
              axiosError.response.data.message || 'Bad request'
            } (Status: ${axiosError.response.status})`
          );
        } else if (axiosError.request) {
          setError('Search failed: No response from server.');
        } else {
          setError('Search failed: An error occurred.');
        }
      } else if (err instanceof Error) {
        setError(err.message);
      }
      setSearchResults([]);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(event.target as Node)) {
        setSearchResults([]);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [searchBoxRef]);

  return (
    <div className={styles.searchBox} ref={searchBoxRef}>
      <input
        type="text"
        placeholder="Search..."
        value={searchTerm}
        onChange={handleSearchChange}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            handleSearch();
          }
        }}
      />
      {error && <p className={styles.error}>{error}</p>}
      {searchResults.length > 0 && (
        <div className={styles.searchResults}>
          {searchResults.map((person) => (
            <div
              key={person.id}
              className={styles.searchResultItem}
              onClick={() => {
                onSelectPerson(person);
                setSearchResults([]);
              }}
            >
              {person.name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchBox;
