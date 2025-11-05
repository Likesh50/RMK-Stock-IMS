import React, { useRef, useState } from 'react';
import ReactToPrint from 'react-to-print';
import styled from 'styled-components';
import { useLocation } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { PurchaseReport } from './PurchaseReport';

const Test = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
`;

/* Button container remains visible on screen but hidden in print */
const ButtonContainer = styled.div`
  display: flex;
  justify-content: center;
  gap: 20px; 
  top: 150px; 
  z-index: 10; 
  padding: 10px;

  @media print {
    display: none; /* hide controls when printing */
  }
`;

const ReportContainer = styled.div`
  margin-top: 20px; 
  width: 100%;
  max-height: 80vh; 
  overflow-y: auto; 
`;

const PrintButton = styled.button`
  background-color: #4CAF50; 
  border: none;
  color: white;
  padding: 10px 18px;
  text-align: center;
  display: inline-block;
  font-size: 14px;
  cursor: pointer;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: background-color 0.3s, box-shadow 0.3s;

  &:hover {
    background-color: #45a049;
    box-shadow: 0 8px 10px rgba(0, 0, 0, 0.2);
  }
`;

const ExportButton = styled.button`
  background-color: #2196F3; 
  border: none;
  color: white;
  padding: 10px 18px;
  text-align: center;
  display: inline-block;
  font-size: 14px;
  cursor: pointer;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: background-color 0.3s, box-shadow 0.3s;

  &:hover {
    background-color: #1976D2;
    box-shadow: 0 8px 10px rgba(0, 0, 0, 0.2);
  }
`;

/* Column selector UI */
const ColumnSelector = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;

  label {
    display: flex;
    gap: 6px;
    align-items: center;
    font-weight: 600;
    color: #164863;
  }

  input[type="checkbox"] {
    transform: scale(1.05);
  }

  @media print {
    display: none; /* hide the UI in print */
  }
`;

const PrintPurchaseReport = () => {
  const reportRef = useRef();
  const location = useLocation();
  const { fromDate, toDate } = location.state || {};

  // columns state (default all true)
  const [visibleColumns, setVisibleColumns] = useState({
    date: true,
    shop: true,
    item: true,
    category: true,
    qty: true,
    price: true,
    total: true
  });

  const toggleColumn = (key) => {
    setVisibleColumns(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleExport = () => {
    if (!reportRef.current) return;
    // Convert the rendered table to sheet
    const table = reportRef.current.querySelector('table');
    if (!table) {
      alert('Nothing to export');
      return;
    }
    const ws = XLSX.utils.table_to_sheet(table);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Purchase Report');
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([wbout], { type: 'application/octet-stream' }), 'Purchase.xlsx');
  };

  return (
    <Test>
      <ButtonContainer>
        <ColumnSelector>
          <label>
            <input type="checkbox" checked={visibleColumns.date} onChange={() => toggleColumn('date')} />
            Date
          </label>
          <label>
            <input type="checkbox" checked={visibleColumns.shop} onChange={() => toggleColumn('shop')} />
            Shop
          </label>
          <label>
            <input type="checkbox" checked={visibleColumns.item} onChange={() => toggleColumn('item')} />
            Item
          </label>
          <label>
            <input type="checkbox" checked={visibleColumns.category} onChange={() => toggleColumn('category')} />
            Category
          </label>
          <label>
            <input type="checkbox" checked={visibleColumns.qty} onChange={() => toggleColumn('qty')} />
            Qty
          </label>
          <label>
            <input type="checkbox" checked={visibleColumns.price} onChange={() => toggleColumn('price')} />
            Price
          </label>
          <label>
            <input type="checkbox" checked={visibleColumns.total} onChange={() => toggleColumn('total')} />
            Total
          </label>
        </ColumnSelector>

        <ReactToPrint
          trigger={() => <PrintButton>Print Purchase Report</PrintButton>}
          content={() => reportRef.current}
        />
        <ExportButton onClick={handleExport}>Export to Excel</ExportButton>
      </ButtonContainer>

      <ReportContainer>
        {/* Pass visibleColumns to PurchaseReport */}
        <PurchaseReport ref={reportRef} fromDate={fromDate} toDate={toDate} visibleColumns={visibleColumns} />
      </ReportContainer>
    </Test>
  );
};

export default PrintPurchaseReport;
