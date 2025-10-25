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
        const parsed = JSON.parse(stored);
        setLocations(parsed);

        // ✅ If no location is saved, use the first one as default
        if (!localStorage.getItem('locationid') && parsed.length > 0) {
          const firstId = parsed[0].location_id;
          const firstName = parsed[0].location_name;
          setSelectedId(firstId);
          localStorage.setItem('locationid', firstId);
          localStorage.setItem('locationname', firstName); // ✅ Save name too
        }

      } catch (err) {
        console.error('Invalid JSON in sessionStorage for userlocations:', err);
      }
    }
  }, []);

 const handleChange = (e) => {
  const value = e.target.value;
  const selected = locations.find(loc => String(loc.location_id) === String(value));

  setSelectedId(value);

  if (selected) {
    localStorage.setItem('locationid', selected.location_id);
    localStorage.setItem('locationname', selected.location_name); // ✅ Save name
  }

  window.location.reload(); // ⬅ Force reload on select
};


  return (
    <select value={selectedId} onChange={handleChange}>
      {locations.map(({ location_id, location_name }) => (
        <option key={location_id} value={location_id}>
          {location_name}
        </option>
      ))}
    </select>
  );
};

export default LocationDropdown;