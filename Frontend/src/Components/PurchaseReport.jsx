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
    display: none; /* ✅ Hide dropdowns in print */
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

export const PurchaseReport = React.forwardRef(({ fromDate, toDate }, ref) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✅ Dropdown state
  const [selectedItem, setSelectedItem] = useState('');
  const [selectedSubcategory, setSelectedSubcategory] = useState('');

  // ✅ Pull locationid from localStorage
  const [selectedId] = useState(() => {
    return localStorage.getItem('locationid') || '';
  });

  useEffect(() => {
    if (!selectedId) {
      console.warn("No locationid found in localStorage");
      setLoading(false);
      return;
    }

    axios.get(`${import.meta.env.VITE_RMK_MESS_URL}/report/purchaseReport`, {
      params: {
        startDate: fromDate,
        endDate: toDate,
        location_id: selectedId
      }
    })
    .then(res => {
      setData(res.data.data || []);
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
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  // ✅ Extract unique items and subcategories
  const uniqueItems = [...new Set(data.map(row => row.item_name))];
  const uniqueSubcategories = [...new Set(data.map(row => row.category))];

  // ✅ Apply filtering
  const filteredData = data.filter(row => {
    return (
      (selectedItem ? row.item_name === selectedItem : true) &&
      (selectedSubcategory ? row.category === selectedSubcategory : true)
    );
  });

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
        <img src={Logo} alt="College Logo" />
        <h1>INVENTORY MANAGEMENT SYSTEM</h1>
      </PrintHeader>
      <h1>Purchase Report</h1>
      <DateRange>
        <h2>From: {formatDate(fromDate)}</h2>
        <h2>To: {formatDate(toDate)}</h2>
      </DateRange>

      {/* ✅ Filters */}
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

      {/* ✅ Table */}
      <ItemTable>
        <thead>
          <tr>
            <th style={{ width: "70px" }}>SNO</th>
            <th>Date</th>
            <th>Item Name</th>
            <th>Category</th>
            <th>Quantity</th>
            {/* <th>Invoice No</th> */}
            <th>Amount</th>
            <th>Shop Name</th>
            <th>Shop Location</th>
          </tr>
        </thead>
        <tbody>
          {filteredData.length > 0 ? (
            filteredData.map((row, index) => (
              <tr key={index}>
                <td>{index + 1}</td>
                <td>{formatDate(row.purchase_date)}</td>
                <td>{row.item_name}</td>
                <td>{row.category}</td>
                <td>{row.quantity}</td>
                {/* <td>{row.invoice_no}</td> */}
                <td>{formatNumber(row.amount)}</td>
                <td>{row.shop_name}</td>
                <td>{row.shop_location}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="9" style={{ textAlign: 'center' }}>
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
