import React, { useRef } from 'react';
import ReactToPrint from 'react-to-print';
import styled from 'styled-components';
import { useLocation } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import ItemMovementReport from './ItemMovementReport';

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
  top: 150px; 
  z-index: 10; 
  padding: 10px;
  border-radius:
`;

const ReportContainer = styled.div`
  margin-top: 80px; 
  width: 100%;
  max-height: 80vh; 
  overflow-y: auto; 
`;

const PrintButton = styled.button`
  background-color: #4CAF50; 
  border: none;
  color: white;
  padding: 15px 32px;
  text-align: center;
  text-decoration: none;
  display: inline-block;
  font-size: 16px;
  cursor: pointer;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: background-color 0.3s, box-shadow 0.3s;

  &:hover {
    background-color: #45a049;
    box-shadow: 0 8px 10px rgba(0, 0, 0, 0.2);
  }

  &:active {
    background-color: #3e8e41;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
    transform: translateY(2px);
  }
`;

const ExportButton = styled.button`
  background-color: #2196F3; 
  border: none;
  color: white;
  padding: 15px 32px;
  text-align: center;
  text-decoration: none;
  display: inline-block;
  font-size: 16px;
  cursor: pointer;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: background-color 0.3s, box-shadow 0.3s;

  &:hover {
    background-color: #1976D2;
    box-shadow: 0 8px 10px rgba(0, 0, 0, 0.2);
  }

  &:active {
    background-color: #1565C0;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
    transform: translateY(2px);
  }
`;

const PrintNetReport = () => {
  const reportRef = useRef();
  const location = useLocation();
  const { fromDate, toDate } = location.state || {};

  const handleExport = () => {
    if (!reportRef.current) {
      console.error('Report ref not available');
      return;
    }

    // Try to find a table inside the forwarded ref. If your report uses multiple tables
    // or a specific id, update this selector accordingly.
    const table = reportRef.current.querySelector('table');
    if (!table) {
      console.error('No table found inside report to export');
      return;
    }

    try {
      const ws = XLSX.utils.table_to_sheet(table);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Item Movement Report');
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      saveAs(new Blob([wbout], { type: 'application/octet-stream' }), 'ItemMovementReport.xlsx');
    } catch (err) {
      console.error('Export failed', err);
    }
  };

  return (
    <Test>
      <ButtonContainer>
        <ReactToPrint
          trigger={() => <PrintButton>Print Net Report</PrintButton>}
          content={() => reportRef.current}
        />
        <ExportButton onClick={handleExport}>Export to Excel</ExportButton>
      </ButtonContainer>

      <ReportContainer>
        {/* forwardRef required in ItemMovementReport for this to work */}
        <ItemMovementReport ref={reportRef} fromDate={fromDate} toDate={toDate} />
      </ReportContainer>
    </Test>
  );
};

export default PrintNetReport;
