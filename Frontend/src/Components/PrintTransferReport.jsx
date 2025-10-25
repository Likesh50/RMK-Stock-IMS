import React, { useRef } from 'react';
import { useLocation } from 'react-router-dom';
import ReactToPrint from 'react-to-print';
import styled from 'styled-components';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import TransferReport from './TransferReport'; // Adjust import if needed

const Container = styled.div`
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
  margin-bottom: 20px;
  padding: 10px;
`;

const PrintButton = styled.button`
  background-color: #4caf50;
  border: none;
  color: white;
  padding: 15px 32px;
  font-size: 16px;
  cursor: pointer;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  transition: background-color 0.3s ease;

  &:hover {
    background-color: #45a049;
  }
`;

const ExportButton = styled.button`
  background-color: #0277bd;
  border: none;
  color: white;
  padding: 15px 32px;
  font-size: 16px;
  cursor: pointer;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  transition: background-color 0.3s ease;

  &:hover {
    background-color: #025f8e;
  }
`;

const ReportContainer = styled.div`
  margin-top: 80px;
  width: 100%;
  max-height: 80vh;
  overflow-y: auto;
`;

const PrintTransferReport = () => {
  const componentRef = useRef();
  const location = useLocation();
  const { fromDate, toDate } = location.state || {};

  const exportExcel = () => {
    if (!componentRef.current) return;

    const table = componentRef.current.querySelector('table');
    if (!table) return;

    const ws = XLSX.utils.table_to_sheet(table);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "TransferReport");
    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([wbout], { type: "application/octet-stream" });
    saveAs(blob, `Transfer_Report_${fromDate || 'all'}_to_${toDate || 'all'}.xlsx`);
  };

  return (
    <Container>
      <ButtonContainer>
        <ReactToPrint
          trigger={() => <PrintButton>Print Transfer Report</PrintButton>}
          content={() => componentRef.current}
          pageStyle={'@page { size: auto; margin: 20mm; }'}
        />
        <ExportButton onClick={exportExcel}>Export to Excel</ExportButton>
      </ButtonContainer>
      <ReportContainer>
        <TransferReport ref={componentRef} fromDate={fromDate} toDate={toDate} />
      </ReportContainer>
    </Container>
  );
};

export default PrintTransferReport;
