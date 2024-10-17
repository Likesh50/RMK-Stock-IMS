import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import Axios from 'axios';
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
    height:100%
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

  td input {
    border: 1px solid #ccc;
    border-radius: 4px;
    padding: 4px;
    font-size: 14px;
    width: 90%;
  }

  td select {
    border: 1px solid #ccc;
    border-radius: 4px;
    padding: 4px;
    font-size: 12px;
    min-width: 180px;
  }

  

  @media print {
    th, td {
      font-size: 7px; 
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

export const DispatchReport = React.forwardRef(({ fromDate, toDate }, ref) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Axios.get(`${import.meta.env.VITE_RMK_MESS_URL}/report/dispatchReport`, {
      params: {
        startDate: fromDate,
        endDate: toDate
      }
    })
    .then(res => {
      setData(res.data.data || []); 
      console.log(res.data);
      setLoading(false);
    })
    .catch(err => {
      console.error("Error fetching report data:", err);
      setLoading(false);
    });
  }, [fromDate, toDate]);

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
        <div className="content">
          <img src={Logo} alt="Logo" />
          <h1>INVENTORY MANAGEMENT SYSTEM</h1>
        </div>
      </PrintHeader>
      <h1>Dispatch Report</h1>
      <DateRange>
        <h2>From: {fromDate}</h2>
        <h2>To: {toDate}</h2>
      </DateRange>
      <ItemTable>
        <thead>
          <tr>
            <th style={{width:"70px"}}>SNO</th>
            <th>Item Name</th>
            <th>Category</th>
            <th>Quantity</th>
            <th>Dispatch Date</th>
            <th>Location</th>
            <th>Receiver</th>
            <th>Incharge</th>
            
          </tr>
        </thead>
        <tbody>
          {data.length > 0 ? (
            data.map((row, index) => {
              
              return (
                <tr key={index}>
                  <td className='sno'>{index+1}</td>
                  <td>{row.item_name}</td>
                  <td>{row.category}</td>
                  <td>{row.quantity}</td>
                  <td>{new Date(row.dispatch_date).toLocaleDateString('en-US')}</td>
                  <td>{row.location}</td>
                  <td>{row.receiver}</td>
                  <td>{row.incharge}</td>
                </tr>
                
              );
            })
          ) : (
            <tr><td colSpan="8">No data available</td></tr>
          )}

        </tbody>
      </ItemTable>
      <Footer>
        Copyright © 2024. All rights reserved to DEPARTMENT of INFORMATION TECHNOLOGY - RMKEC
      </Footer>

      </Container>
  );
});