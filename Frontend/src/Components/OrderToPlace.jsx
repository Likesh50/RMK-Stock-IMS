import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import Axios from 'axios';
import moment from 'moment';

/* ✅ PRINT & EXCEL */
import ReactToPrint from 'react-to-print';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const Container = styled.div`
  h1 {
    color: #164863;
    text-align: center;
  }
`;

const ButtonBar = styled.div`
  display: flex;
  justify-content: center;
  gap: 16px;
  margin: 12px 0;

  @media print {
    display: none;
  }
`;

const PrintButton = styled.button`
  background-color: #4CAF50;
  border: none;
  color: white;
  padding: 12px 22px;
  font-size: 15px;
  cursor: pointer;
  border-radius: 8px;
`;

const ExportButton = styled.button`
  background-color: #2196F3;
  border: none;
  color: white;
  padding: 12px 22px;
  font-size: 15px;
  cursor: pointer;
  border-radius: 8px;
`;

const SearchContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 20px 0;

  .search-input {
    padding: 10px;
    border: 1px solid #164863;
    border-radius: 4px;
    font-size: 16px;
    width: 300px;
    margin-right: 10px;
  }

  .search-button {
    padding: 10px 20px;
    border: none;
    border-radius: 4px;
    background-color: #4caf50;
    color: white;
    font-size: 16px;
    cursor: pointer;
  }
`;

const TableHeader = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 30px;

  th {
    background-color: #3582ab;;
    color: white;
    padding: 10px;
    border: 1px solid #ddd;
  }

  td {
    padding: 10px;
    border: 1px solid #ddd;
    text-align: center;
  }

  tbody tr:nth-child(even) {
    background-color: #f4f4f4;
  }
`;

function OrderToPlace() {
  const printRef = useRef(null);

  const [curr, setCurr] = useState([]);
  const [filteredCurr, setFilteredCurr] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const locationId = parseInt(window.localStorage.getItem('locationid'), 10);
    Axios.get(`${import.meta.env.VITE_RMK_MESS_URL}/minquant/minquant?location_id=${locationId}`)
      .then(res => {
        setCurr(res.data);
        setFilteredCurr(res.data);
      })
      .catch(err => console.error("Error fetching data:", err));
  }, []);

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    const filtered = curr.filter(item =>
      item.item_name.toLowerCase().includes(value.toLowerCase()) ||
      item.category.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredCurr(filtered);
  };

  const exportExcel = () => {
    const table = printRef.current.querySelector('table');
    if (!table) return;

    const ws = XLSX.utils.table_to_sheet(table);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Order To Place');
    const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([buf]), 'OrderToPlace.xlsx');
  };

  return (
    <Container ref={printRef}>
      <h1>ITEMS TO ORDER</h1>

      {/* ✅ PRINT & EXPORT BUTTONS */}
      <ButtonBar>
        <ReactToPrint
          trigger={() => <PrintButton>Print</PrintButton>}
          content={() => printRef.current}
        />
        <ExportButton onClick={exportExcel}>Export to Excel</ExportButton>
      </ButtonBar>

      <SearchContainer>
        <input
          type="text"
          className="search-input"
          placeholder="Enter item name / Category name"
          value={searchTerm}
          onChange={handleSearch}
        />
        <button className="search-button">Search</button>
      </SearchContainer>

      <TableHeader>
        <thead>
          <tr>
            <th>ITEM NAME</th>
            <th>CATEGORY</th>
            <th>MINIMUM QUANTITY</th>
            <th>AVAILABLE QUANTITY</th>
          </tr>
        </thead>

        <tbody>
          {filteredCurr.length > 0 ? (
            filteredCurr.map((item, index) => (
              <tr key={index}>
                <td>{item.item_name}</td>
                <td>{item.category}</td>
                <td>{item.min_quantity} {item.unit}</td>
                <td>{item.total_quantity} {item.unit}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="4">No data available</td>
            </tr>
          )}
        </tbody>
      </TableHeader>
    </Container>
  );
}

export default OrderToPlace;
