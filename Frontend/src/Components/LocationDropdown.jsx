import React, { useState, useEffect } from 'react';

const LocationDropdown = () => {
  const [locations, setLocations] = useState([]);
  const [selectedId, setSelectedId] = useState(() => {
    return localStorage.getItem('locationid') || '';
  });

  useEffect(() => {
    const stored = sessionStorage.getItem('userlocations');
    if (stored) {
      try {
        setLocations(JSON.parse(stored));
      } catch (err) {
        console.error('Invalid JSON in sessionStorage for userlocations:', err);
      }
    }
  }, []);

  const handleChange = (e) => {
    const value = e.target.value;
    setSelectedId(value);
    localStorage.setItem('locationid', value);
    window.location.reload(); // ⬅️ Force reload on select
  };

  return (
    <select value={selectedId} onChange={handleChange}>
      <option value="">— Select Location —</option>
      {locations.map(({ location_id, location_name }) => (
        <option key={location_id} value={location_id}>
          {location_name}
        </option>
      ))}
    </select>
  );
};

export default LocationDropdown;
