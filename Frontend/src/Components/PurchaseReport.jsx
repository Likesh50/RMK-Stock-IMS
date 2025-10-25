import React from 'react';
import axios from 'axios';
import { useState, useEffect } from 'react';
import styled from 'styled-components';
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

// Institution name mapping (keys must match the locationid values saved in localStorage)
const institutionMap = {
  RMKEC: "R.M.K. Engineering College",
  RMD: "R.M.D. Engineering College",
  RMKCET: "R.M.K. College of Engg. & Technology", // You can use the full name here
  "RMK Residential school": "R.M.K. Residential School", // Note the quotes for spaces
  "RMK Patashala": "R.M.K. Patashala" // Note the quotes for spaces
};
export const PurchaseReport = React.forwardRef(({ fromDate, toDate }, ref) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Dropdown state
  const [selectedItem, setSelectedItem] = useState('');
  const [selectedSubcategory, setSelectedSubcategory] = useState('');

  // Pull locationid from localStorage
  const [selectedId] = useState(() => {
    return localStorage.getItem('locationid') || '';
  });

  // Backend-returned grand total (fallback to computed if absent)
  const [backendGrandTotal, setBackendGrandTotal] = useState(null);

  useEffect(() => {
    if (!selectedId) {
      console.warn("No locationid found in localStorage");
      setLoading(false);
      return;
    }

    setLoading(true);
    axios.get(`${import.meta.env.VITE_RMK_MESS_URL}/report/purchaseReport`, {
      params: {
        startDate: fromDate,
        endDate: toDate,
        location_id: selectedId
      }
    })
    .then(res => {
      const resp = res.data;
      const rows = Array.isArray(resp.data) ? resp.data : [];
      // Normalize numbers (if backend already returns numbers this is safe)
      const normalized = rows.map(r => ({
        ...r,
        quantity: Number(r.quantity) || 0,
        price: Number(r.price || r.amount) || 0,
        total: Number(r.total) || (Number(r.quantity || 0) * Number(r.price || r.amount || 0))
      }));
      setData(normalized);
      if (typeof resp.grandTotal !== 'undefined' && resp.grandTotal !== null) {
        setBackendGrandTotal(Number(resp.grandTotal));
      } else {
        setBackendGrandTotal(null);
      }
      setLoading(false);
    })
    .catch(err => {
      console.error("Error fetching report data:", err);
      setLoading(false);
    });
  }, [fromDate, toDate, selectedId]);

  const formatNumber = (number) => {
    return Number(number).toFixed(2);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date)) return dateString; // fallback if string already formatted
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  // Unique items and categories for filters
  const uniqueItems = [...new Set(data.map(row => row.item_name))];
  const uniqueSubcategories = [...new Set(data.map(row => row.category))];



  // Filtering
  const filteredData = data.filter(row => {
    return (
      (selectedItem ? row.item_name === selectedItem : true) &&
      (selectedSubcategory ? row.category === selectedSubcategory : true)
    );
  });

  // Compute grand total if backend didn't provide it
  const computedGrandTotal = filteredData.reduce((sum, row) => sum + (Number(row.total) || (Number(row.quantity || 0) * Number(row.price || 0))), 0);
  const grandTotalToShow = (backendGrandTotal !== null) ? backendGrandTotal : computedGrandTotal;

  const institutionCode = localStorage.getItem('locationname') || ""; // e.g., "RMKCET"
const institutionName = institutionMap[institutionCode] || institutionCode; // institutionMap["RMKCET"] -> "R.M.K. College of Engg. & Technology"

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
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
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
          <h1 style={{ leftmargin: 0 }}>Purchase Report</h1>
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

      {/* Filters */}
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

      {/* Table with new column order and totals */}
      <ItemTable>
        <thead>
          <tr>
            <th style={{ width: "60px" }}>SL.NO</th>
            <th style={{ width: "120px" }}>DATE</th>
            <th>SHOP NAME</th>
            <th>ITEM NAME</th>
            <th>CATEGORY</th>
            <th style={{ width: "80px" }}>QTY</th>
            <th style={{ width: "100px" }}>PRICE</th>
            <th style={{ width: "120px" }}>TOTAL</th>
          </tr>
        </thead>
        <tbody>
          {filteredData.length > 0 ? (
            filteredData.map((row, index) => (
              <tr key={index}>
                <td>{index + 1}</td>
                <td>{formatDate(row.purchase_date)}</td>
                <td>{row.shop_name}</td>
                <td style={{ textAlign: 'left' }}>{row.item_name}</td>
                <td>{row.category}</td>
                <td>{row.quantity}</td>
                <td>{formatNumber(row.price)}</td>
                <td>{formatNumber(row.total)}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="8" style={{ textAlign: 'center' }}>
                No data available
              </td>
            </tr>
          )}

          {/* End of Report + Grand Total row */}
          <tr>
            <td colSpan="5" style={{ textAlign: "left", fontWeight: "bold", paddingLeft: 12 }}>END OF REPORT</td>
            <td colSpan="2" style={{ textAlign: "right", fontWeight: "bold", paddingRight: 12 }}>GRAND TOTAL</td>
            <td style={{ fontWeight: "bold" }}>{formatNumber(grandTotalToShow)}</td>
          </tr>
        </tbody>
      </ItemTable>

      <Footer>
        Copyright © 2024. All rights reserved to DEPARTMENT of INFORMATION TECHNOLOGY - RMKEC
      </Footer>
    </Container>
  );
});

export default PurchaseReport;
