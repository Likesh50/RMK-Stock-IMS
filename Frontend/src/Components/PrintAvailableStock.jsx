// PrintAvailableStock.jsx
import React, { useRef } from 'react';
import ReactToPrint from 'react-to-print';
import styled, { createGlobalStyle } from 'styled-components';
import { useLocation } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import AvailableStock from './AvailableStock'; // adjust path if needed

/* Global print helper: hide everything outside .printable-area when printing */
const PrintHelper = createGlobalStyle`
  @media print {
    /* hide entire app by default */
    body * {
      visibility: hidden !important;
    }

    /* make printable area visible */
    .printable-area, .printable-area * {
      visibility: visible !important;
    }

    /* make printable area occupy the page */
    .printable-area {
      position: absolute !important;
      left: 0 !important;
      top: 0 !important;
      width: 100% !important;
      margin: 0 !important;
      padding: 0 !important;
    }

    /* remove page margins in some browsers if desired (optional) */
    @page { margin: 12mm; }
  }
`;

const Test = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
`;

const ButtonContainer = styled.div`
  display: flex;
  justify-content: center;
  gap: 20px;
  z-index: 10;
  padding: 10px;
  margin-top: 18px;

  @media print {
    display: none; /* Hide the UI buttons when printing (we use print header inside AvailableStock) */
  }
`;

const ReportContainer = styled.div`
  margin-top: 18px;
  width: 100%;
  max-height: 80vh;
  overflow-y: auto;
`;

/* Buttons */
const PrintButton = styled.button`
  background-color: #4CAF50;
  border: none;
  color: white;
  padding: 12px 22px;
  text-align: center;
  font-size: 15px;
  cursor: pointer;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  transition: background-color 0.2s, box-shadow 0.2s;

  &:hover { background-color: #45a049; }
  &:active { transform: translateY(1px); }
`;

const ExportButton = styled.button`
  background-color: #2196F3;
  border: none;
  color: white;
  padding: 12px 22px;
  text-align: center;
  font-size: 15px;
  cursor: pointer;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  transition: background-color 0.2s, box-shadow 0.2s;

  &:hover { background-color: #1976D2; }
  &:active { transform: translateY(1px); }
`;

const PrintAvailableStock = () => {
  const reportRef = useRef();
  const location = useLocation();
  const { fromDate, toDate } = location.state || {};

  const handleExport = () => {
    if (!reportRef.current) {
      console.error('Report ref not available');
      return;
    }

    const table = reportRef.current.querySelector('table');
    if (!table) {
      console.error('No table found inside report to export');
      return;
    }

    try {
      const ws = XLSX.utils.table_to_sheet(table);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Available Stock');
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      saveAs(new Blob([wbout], { type: 'application/octet-stream' }), 'AvailableStock.xlsx');
    } catch (err) {
      console.error('Export failed', err);
    }
  };

  return (
    <Test>
      {/* inject print helper CSS */}
      <PrintHelper />

      <ButtonContainer>
        <ReactToPrint
          trigger={() => <PrintButton>Print Available Stock</PrintButton>}
          content={() => reportRef.current}
          pageStyle={`
            @page { margin: 12mm; }
            @media print {
              body { -webkit-print-color-adjust: exact; }
            }
          `}
        />
        <ExportButton onClick={handleExport}>Export to Excel</ExportButton>
      </ButtonContainer>

      <ReportContainer>
        {/* IMPORTANT: .printable-area ensures only this content prints.
            forwardRef required in AvailableStock for printing/exporting */}
        <div className="printable-area">
          <AvailableStock ref={reportRef} fromDate={fromDate} toDate={toDate} />
        </div>
      </ReportContainer>
    </Test>
  );
};

export default PrintAvailableStock;
