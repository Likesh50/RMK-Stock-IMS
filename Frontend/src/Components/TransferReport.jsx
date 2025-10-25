import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import axios from 'axios';
import Logo from '../assets/Logo.png';
import { HashLoader } from 'react-spinners';

const Container = styled.div`
  @media print {
    margin: 20px;
  }
  h1 {
    color: #164863;
    text-align: center;
  }
`;

const FilterContainer = styled.div`
  display: flex;
  justify-content: flex-start;
  gap: 20px;
  margin-bottom: 20px;
  label {
    font-size: 16px;
    font-weight: bold;
    color: #164863;
  }
  select {
    padding: 6px;
    border-radius: 4px;
    border: 1px solid #ccc;
    min-width: 180px;
    font-size: 14px;
  }
  @media print {
    display: none;
  }
`;

const ItemTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-family: Arial, sans-serif;
  table-layout: fixed;
  th, td {
    border: 1px solid #ddd;
    padding: 10px;
    text-align: center;
    overflow-wrap: break-word;
    word-break: break-word;
    font-size: 18px;
  }
  th {
    background-color: #164863;
    color: white;
    font-size: 15px;
    font-weight: bold;
  }
  tbody tr {
    background-color: #f9f9f9;
  }
  tbody tr:nth-child(even) {
    background-color: #f1f1f1;
  }
  tbody tr:hover {
    background-color: #e0f7fa;
    color: #000;
  }
  @media print {
    th, td {
      font-size: 11px;
    }
  }
`;

const DateRange = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
  h2 {
    margin: 0;
    font-size: 20px;
  }
`;

const PrintHeader = styled.div`
  display: none;
  text-align: center;
  margin-bottom: 20px;
  img {
    width: 150px;
    height: auto;
    margin-bottom: 10px;
  }
  h1 {
    font-size: 30px;
  }
  @media print {
    display: block;
  }
`;

const Footer = styled.footer`
  text-align: center;
  padding: 10px;
  background-color: #164863;
  color: white;
  margin-top: 0px;
  display: none;
  @media print {
    display: block;
  }
`;

const institutionMap = {
  RMKEC: "R.M.K. Engineering College",
  RMD: "R.M.D. Engineering College",
  RMKCET: "R.M.K. College of Engg. & Technology",
  "RMK Residential school": "R.M.K. Residential School",
  "RMK Patashala": "R.M.K. Patashala"
};

// MetaInfo styled component (same as PurchaseReport)
const MetaInfo = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 50px;
  margin: 20px 0 30px 0;
  color: #164863;
  text-align: left;

  div {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    min-width: 180px;
  }

  .meta-label {
    font-weight: 700;
    font-size: 17px;
    color: #164863;
  }

  .meta-value {
    font-weight: 500;
    font-size: 17px;
  }

  @media print {
    justify-content: space-between;
    gap: 10px;
    margin: 10px 0 15px 0;

    .meta-label,
    .meta-value {
      font-size: 18px;
    }

    div {
      min-width: auto;
      align-items: flex-start;
    }
  }
`;

export const TransferReport = React.forwardRef(({ fromDate, toDate }, ref) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  // Filters
  const [selectedItem, setSelectedItem] = useState('');
  const [selectedSubcategory, setSelectedSubcategory] = useState('');
  const [selectedFromLocation] = useState(() => localStorage.getItem('locationid') || '');

  // Load userlocations from sessionStorage to prefer friendly location name
  const [locations, setLocations] = useState([]);
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

  // Derive selected location name from the locations array (fallbacks handled below)
  const selectedLocationNameFromSession = locations.find(
    loc => String(loc.location_id) === String(selectedFromLocation)
  )?.location_name || '';

  useEffect(() => {
    if (!fromDate || !toDate) {
      setLoading(false);
      setData([]);
      return;
    }
    setLoading(true);

    axios.get(`${import.meta.env.VITE_RMK_MESS_URL}/report/transferReport`, {
      params: {
        startDate: fromDate, 
        endDate: toDate,
        from_location_id: selectedFromLocation,
        item_id: selectedItem,
        category: selectedSubcategory
      }    
    })
    .then(res => {
      const resp = res.data;
      const rows = Array.isArray(resp.data) ? resp.data : [];
      setData(rows);
      setLoading(false);
    })
    .catch(() => {
      setData([]);
      setLoading(false);
    });
  }, [fromDate, toDate, selectedItem, selectedSubcategory, selectedFromLocation]);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date)) return dateString;
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const uniqueItems = [...new Set(data.map(row => row.item_name))];
  const uniqueSubcategories = [...new Set(data.map(row => row.category))];

  // Institution name resolution:
  // 1) try session's userlocations (selectedLocationNameFromSession)
  // 2) try localStorage key 'locationname' mapped via institutionMap
  // 3) fallback to whatever localStorage 'locationname' contains or empty string
  const locationnameKey = localStorage.getItem('locationname') || '';
  const institutionName = selectedLocationNameFromSession || (institutionMap[locationnameKey] || locationnameKey);

  if (loading) {
    return (
      <div style={{
        position: 'fixed',
        top: '0',
        left: '0',
        width: '100%',
        height: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.7)'
      }}>
        <HashLoader color="#164863" loading={loading} size={90} />
      </div>
    );
  }

  return (
    <Container ref={ref} className="print-container">
      <PrintHeader>
        <img src={Logo} alt="Logo" />
        <h1>INVENTORY MANAGEMENT SYSTEM</h1>
      </PrintHeader>

      <div style={{ textAlign: 'center' }}>
        <h1 style={{ margin: 0 }}>Stock Transfer</h1>
      </div>

      {/* MetaInfo block (matches PurchaseReport style) */}
      <MetaInfo>
        <div>
          <span className="meta-label">Institution</span>
          <span className="meta-value">{institutionName || '—'}</span>
        </div>
        <div>
          <span className="meta-label">Report Date</span>
          <span className="meta-value">{formatDate(new Date().toISOString())}</span>
        </div>
        <div>
          <span className="meta-label">From</span>
          <span className="meta-value">{formatDate(fromDate)}</span>
        </div>
        <div>
          <span className="meta-label">To</span>
          <span className="meta-value">{formatDate(toDate)}</span>
        </div>
        <div>
          <span className="meta-label">Item</span>
          <span className="meta-value">{selectedItem || 'All'}</span>
        </div>
        <div>
          <span className="meta-label">Category</span>
          <span className="meta-value">{selectedSubcategory || 'All'}</span>
        </div>
      </MetaInfo>

      {/* From / To */}
      <DateRange>
        <h2 style={{ visibility: 'hidden' }}>From: {formatDate(fromDate)}</h2>
        <h2 style={{ visibility: 'hidden' }}>To: {formatDate(toDate)}</h2>
      </DateRange>

      <FilterContainer>
        <div>
          <label>Item: </label>
          <select value={selectedItem} onChange={(e) => setSelectedItem(e.target.value)}>
            <option value="">All</option>
            {uniqueItems.map((item, i) => (
              <option key={i} value={item}>{item}</option>
            ))}
          </select>
        </div>
        <div>
          <label>Subcategory: </label>
          <select value={selectedSubcategory} onChange={(e) => setSelectedSubcategory(e.target.value)}>
            <option value="">All</option>
            {uniqueSubcategories.map((cat, i) => (
              <option key={i} value={cat}>{cat}</option>
            ))}
          </select> 
        </div>
      </FilterContainer>

      <ItemTable>
        <thead>
          <tr>
            <th style={{ width: "65px" }}>SL.NO</th>
            <th style={{ width: "130px" }}>DATE</th>
            <th>ITEM NAME</th>
            <th>CATEGORY</th>
            <th>RECEIVED FROM</th>
            <th style={{ width: "80px" }}>QTY</th>
            <th>ISSUED TO</th>
            <th style={{ width: "80px" }}>QTY</th>
          </tr>
        </thead>
        <tbody>
          {data.length > 0 ? (
            data.map((row, index) => (
              <tr key={index}>
                <td>{index + 1}</td>
                <td>{formatDate(row.transfer_date)}</td>
                <td style={{ textAlign: 'left' }}>{row.item_name}</td>
                <td>{row.category}</td>
                <td>{row.received_fr}</td>
                <td>{row.qty_received}</td>
                <td>{row.issued_to}</td>
                <td>{row.qty_issued}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="8" style={{ textAlign: 'center' }}>
                No data available
              </td>
            </tr>
          )}
        </tbody>
      </ItemTable>
      <Footer>
        Copyright © 2024. All rights reserved to DEPARTMENT of INFORMATION TECHNOLOGY - RMKEC
      </Footer>
    </Container>
  );
});

export default TransferReport;
