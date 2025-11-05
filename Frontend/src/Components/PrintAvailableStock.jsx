import React, { useRef } from 'react';
import ReactToPrint from 'react-to-print';
import styled from 'styled-components';
import { useLocation } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import AvailableStock from './AvailableStock'; // adjust path if needed

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
    display: none; /* hide UI when printing */
  }
`;

const ReportContainer = styled.div`
  margin-top: 18px;
  width: 100%;
  max-height: 80vh;
  overflow-y: auto;
  /* Ensure printed content uses full width */
  .print-root {
    width: 100%;
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

const PrintAvailableStock = () => {
  const reportRef = useRef(null);
  const location = useLocation();
  const { fromDate, toDate } = location.state || {};

  const handleExport = () => {
    if (!reportRef.current) {
      alert('Report not ready to export. Please wait until data loads.');
      return;
    }

    const table = reportRef.current.querySelector('table');
    if (!table) {
      alert('No table found to export. Make sure data has loaded.');
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
      alert('Export failed. See console for details.');
    }
  };

  // Small pageStyle to preserve colors and set margins
  const pageStyle = `
    @page { margin: 12mm; }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  `;

  return (
    <Test>
      <ButtonContainer>
        <ReactToPrint
          trigger={() => <PrintButton>Print Available Stock</PrintButton>}
          content={() => reportRef.current}
          pageStyle={pageStyle}
        />
        <ExportButton onClick={handleExport}>Export to Excel</ExportButton>
      </ButtonContainer>

      <ReportContainer>
        {/* Attach ref directly to AvailableStock (it uses forwardRef) */}
        <div className="print-root">
          <AvailableStock ref={reportRef} fromDate={fromDate} toDate={toDate} />
        </div>
      </ReportContainer>
    </Test>
  );
};

export default PrintAvailableStock;
