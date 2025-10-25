// AvailableStock.jsx
import React, { useState, useEffect, forwardRef } from 'react';
import styled from 'styled-components';
import Axios from 'axios';
import moment from 'moment';
import Logo from '../assets/Logo.png'; // adjust path if needed

const THEME_COLOR = '#164863';

const Container = styled.div`
  font-family: Arial, Helvetica, sans-serif;
  padding: 18px;
  background: #fff;

  h1 {
    color: ${THEME_COLOR};
    text-align: center;
    margin: 8px 0 12px 0;
  }

  @media print {
    margin: 0;
    padding: 6px;
    background: #fff;
    color: #000;
  }
`;

const TopBar = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  margin: 12px 0;
  flex-wrap: wrap;

  @media print {
    display: none;
  }
`;

const SearchContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;

  .search-input {
    padding: 10px;
    border: 1px solid ${THEME_COLOR};
    border-radius: 4px;
    font-size: 16px;
    width: 360px;
    box-sizing: border-box;
    background-color: #fff;

    &::placeholder { color: #888; }

    &:focus {
      outline: none;
      box-shadow: 0 0 6px rgba(22,72,99,0.12);
      border-color: ${THEME_COLOR};
    }
  }

  .search-button {
    padding: 10px 16px;
    border: none;
    border-radius: 4px;
    background-color: #4caf50;
    color: white;
    font-size: 15px;
    cursor: pointer;

    &:hover { background-color: #45a049; }
    &:active { transform: translateY(1px); }
  }

  @media print {
    display: none;
  }
`;

const InstitutionBlock = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-width: 0;
  font-weight: 700;
  color: ${THEME_COLOR};
  text-align: center;
  margin-bottom: 6px;

  .label { font-size: 18px; font-weight: 700; color: #666; }
  .value { font-size: 16px; color: ${THEME_COLOR}; }

  @media print {
    .label { font-size: 11px; color: #333; }
    .value { font-size: 13px; color: #000; }
  }
`;

const PrintHeader = styled.div`
  display: none;
  text-align: center;
  margin-bottom: 12px;

  img { width: 140px; height: auto; margin-bottom: 6px; }
  h1 { font-size: 20px; margin: 0; color: ${THEME_COLOR}; }

  @media print { display: block; }
`;

const TableHeader = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 8px;
  font-family: Arial, sans-serif;
  table-layout: fixed;
  background: #fff;

  thead th {
    background-color: ${THEME_COLOR};
    color: white;
    font-size: 14px;
    font-weight: 700;
    padding: 10px;
    border: 1px solid #e6e6e6;
    text-align: center;
    overflow-wrap: break-word;
    word-break: break-word;
  }

  td {
    padding: 10px;
    border: 1px solid #e6e6e6;
    text-align: center;
    font-size: 14px;
    overflow-wrap: break-word;
    word-break: break-word;
  }

  tbody tr:nth-child(even) {
    background-color: #fbfbfb;
  }

  @media print {
    thead th { -webkit-print-color-adjust: exact; color: #fff; }
    th, td { font-size: 12px; padding: 8px; color: #000; }
    tbody tr:nth-child(even) { background-color: transparent; }
  }
`;

const EmptyRow = styled.tr`
  td { padding: 20px; text-align: center; color: #555; }
`;

const LocalPrintButton = styled.button`
  background-color: #4CAF50;
  border: none;
  color: white;
  padding: 8px 14px;
  font-size: 13px;
  border-radius: 6px;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0,0,0,0.08);

  &:hover { background-color: #45a049; }
  &:active { transform: translateY(1px); }

  @media print { display: none; }
`;

const institutionMap = {
  RMKEC: "R.M.K. Engineering College",
  RMD: "R.M.D. Engineering College",
  RMKCET: "R.M.K. College of Engg. & Technology",
  "RMK Residential school": "R.M.K. Residential School",
  "RMK Patashala": "R.M.K. Patashala"
};

const AvailableStock = forwardRef((props, ref) => {
  const { fromDate, toDate } = props || {};
  const [curr, setCurr] = useState([]);
  const [filteredCurr, setFilteredCurr] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [locations, setLocations] = useState([]);

  useEffect(() => {
    const stored = sessionStorage.getItem('userlocations');
    if (stored) {
      try { setLocations(JSON.parse(stored)); } catch (e) { /* ignore */ }
    }
  }, []);

  const selectedLocationId = localStorage.getItem('locationid') || '';
  const locationnameKey = localStorage.getItem('locationname') || '';
  const selectedLocationNameFromSession = locations.find(
    loc => String(loc.location_id) === String(selectedLocationId)
  )?.location_name || '';

  const institutionName = selectedLocationNameFromSession || (institutionMap[locationnameKey] || locationnameKey || '—');

  useEffect(() => {
    const locId = parseInt(window.localStorage.getItem('locationid'), 10);
    const url = `${import.meta.env.VITE_RMK_MESS_URL}/stocks/availablestock?location_id=${locId || ''}`;

    Axios.get(url)
      .then(res => {
        const rows = Array.isArray(res.data?.data) ? res.data.data : [];
        const data = rows.map(stock => ({
          ...stock,
          daysSincePurchase: calculateDaysSince(stock.purchase_date),
        }));
        setCurr(data);
        setFilteredCurr(data);
      })
      .catch(err => {
        console.error("Error fetching stock data:", err);
        setCurr([]);
        setFilteredCurr([]);
      });
  }, []);

  const calculateDaysSince = (purchaseDate) => {
    if (!purchaseDate) return null;
    const today = moment();
    const purchase = moment(purchaseDate);
    return today.diff(purchase, 'days');
  };

  const handleSearch = (e) => {
    const searchValue = e?.target?.value ?? '';
    setSearchTerm(searchValue);
    const filteredData = curr.filter(item => {
      const itemName = (item.itemName || '').toString().toLowerCase();
      const category = (item.category || '').toString().toLowerCase();
      return itemName.includes(searchValue.toLowerCase()) || category.includes(searchValue.toLowerCase());
    });
    setFilteredCurr(filteredData);
  };

  const formatNumber = (number) => {
    if (number == null || number === '') return '0';
    const n = Number(number);
    if (Number.isNaN(n)) return '0';
    return n.toFixed(0);
  };

  return (
    <Container ref={ref}>
      <PrintHeader>
        <img src={Logo} alt="Logo" />
        <h1>INVENTORY MANAGEMENT SYSTEM</h1>
      </PrintHeader>

      <h1>AVAILABLE STOCK</h1>

      <InstitutionBlock>
        <span className="label">Institution</span>
        <span className="value">{institutionName || '—'}</span>
      </InstitutionBlock>

      <TopBar>
        <SearchContainer>
          <input
            type="text"
            className="search-input"
            placeholder="Enter item name / Category name"
            value={searchTerm}
            onChange={handleSearch}
            aria-label="Search input"
          />
          <button
            className="search-button"
            onClick={() => handleSearch({ target: { value: searchTerm } })}
            aria-label="Search"
          >
            Search
          </button>
        </SearchContainer>

        <LocalPrintButton onClick={() => window.print()}>Print</LocalPrintButton>
      </TopBar>

      <TableHeader>
        <thead>
          <tr>
            <th style={{width: '35%'}}>ITEM</th>
            <th style={{width: '20%'}}>SUB CATEGORY</th>
            <th style={{width: '20%'}}>CATEGORY</th>
            <th style={{width: '25%'}}>QUANTITY</th>
          </tr>
        </thead>
        <tbody>
          {filteredCurr && filteredCurr.length > 0 ? filteredCurr.map((item, index) => (
            <tr key={index}>
              <td style={{ textAlign: 'left' }}>{item.itemName || '—'}</td>
              <td style={{ textAlign: 'left' }}>{item.subCategory || item.sub_category || '—'}</td>
              <td style={{ textAlign: 'left' }}>{item.category || '—'}</td>
              <td style={{ textAlign: 'center' }}>{formatNumber(item.quantity) + (item.unit ? ` ${item.unit}` : '')}</td>
            </tr>
          )) : (
            <EmptyRow>
              <td colSpan="4">No data available</td>
            </EmptyRow>
          )}
        </tbody>
      </TableHeader>
    </Container>
  );
});

export default AvailableStock;
