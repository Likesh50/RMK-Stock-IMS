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

export const TransferReport = React.forwardRef(({ fromDate, toDate }, ref) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  // Filters
  const [selectedItem, setSelectedItem] = useState('');
  const [selectedSubcategory, setSelectedSubcategory] = useState('');
  const [selectedFromLocation] = useState(() => localStorage.getItem('locationid') || '');

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

  const institutionCode = localStorage.getItem('locationname') || "";
  const institutionName = institutionMap[institutionCode] || institutionCode;

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
          <h1 style={{ leftmargin: 0 }}>Stock Transfer</h1>
        </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div style={{ textAlign: 'left', fontWeight: 'bold' }}>
          NAME OF THE INSTITUTION : <span style={{ fontWeight: 400 }}>{institutionName}</span>
        </div>
        <div style={{ textAlign: 'right', fontWeight: 'bold' }}>
          DATE : <span style={{ fontWeight: 400 }}>{formatDate(new Date().toISOString())}</span>
        </div>
      </div>

      {/* From / To */}
      <DateRange>
        <h2>From: {formatDate(fromDate)}</h2>
        <h2>To: {formatDate(toDate)}</h2>
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
                <td>{row.item_name}</td>
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
