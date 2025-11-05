import React, { useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import ReactToPrint from 'react-to-print';
import styled from 'styled-components';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import TransferReport from './TransferReport'; // adjust path if needed

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
  gap: 16px;
  margin-bottom: 20px;
  padding: 10px;

  @media print {
    display: none; /* hide controls in print */
  }
`;

const ControlGroup = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;

  button.small {
    padding: 6px 10px;
    border-radius: 6px;
    cursor: pointer;
    border: 1px solid #ccc;
    background: #fff;
  }

  label {
    display: flex;
    align-items: center;
    gap: 6px;
    font-weight: 600;
    color: #164863;
  }
`;

const PrintButton = styled.button`
  background-color: #4caf50;
  border: none;
  color: white;
  padding: 10px 18px;
  font-size: 14px;
  cursor: pointer;
  border-radius: 8px;
`;

const ExportButton = styled.button`
  background-color: #0277bd;
  border: none;
  color: white;
  padding: 10px 18px;
  font-size: 14px;
  cursor: pointer;
  border-radius: 8px;
`;

const ReportContainer = styled.div`
  margin-top: 20px;
  width: 100%;
  max-height: 80vh;
  overflow-y: auto;
`;

const ColumnSelector = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;

  label { display:flex; gap:6px; align-items:center; color:#164863; font-weight:600; }
  input[type="checkbox"] { transform: scale(1.02); }

  @media print { display: none; }
`;

const PrintTransferReport = () => {
  const reportRef = useRef();
  const location = useLocation();
  const { fromDate, toDate } = location.state || {};

  const [visibleColumns, setVisibleColumns] = useState({
    sno: true,
    date: true,
    item: true,
    category: true,
    received_fr: true,
    qty_received: true,
    issued_to: true,
    qty_issued: true
  });

  const toggle = (key) => setVisibleColumns(prev => ({ ...prev, [key]: !prev[key] }));

  const selectAll = () => {
    setVisibleColumns({
      sno: true, date: true, item: true, category: true,
      received_fr: true, qty_received: true, issued_to: true, qty_issued: true
    });
  };

  const clearAll = () => {
    // keep sno visible to help read rows (change if you want it hideable)
    setVisibleColumns({
      sno: true, date: false, item: false, category: false,
      received_fr: false, qty_received: false, issued_to: false, qty_issued: false
    });
  };

  const exportExcel = () => {
    if (!reportRef.current) return;
    const table = reportRef.current.querySelector('table');
    if (!table) {
      alert('Nothing to export');
      return;
    }
    const ws = XLSX.utils.table_to_sheet(table);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "TransferReport");
    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([wbout], { type: "application/octet-stream" }), `Transfer_Report_${fromDate || 'all'}_to_${toDate || 'all'}.xlsx`);
  };

  return (
    <Container>
      <ButtonContainer>
        <ControlGroup>
          <button className="small" onClick={selectAll}>Select all</button>
          <button className="small" onClick={clearAll}>Clear all</button>
        </ControlGroup>

        <ColumnSelector>
          <label><input type="checkbox" checked={visibleColumns.date} onChange={() => toggle('date')} />Date</label>
          <label><input type="checkbox" checked={visibleColumns.item} onChange={() => toggle('item')} />Item</label>
          <label><input type="checkbox" checked={visibleColumns.category} onChange={() => toggle('category')} />Category</label>
          <label><input type="checkbox" checked={visibleColumns.received_fr} onChange={() => toggle('received_fr')} />Received From</label>
          <label><input type="checkbox" checked={visibleColumns.qty_received} onChange={() => toggle('qty_received')} />Qty (Received)</label>
          <label><input type="checkbox" checked={visibleColumns.issued_to} onChange={() => toggle('issued_to')} />Issued To</label>
          <label><input type="checkbox" checked={visibleColumns.qty_issued} onChange={() => toggle('qty_issued')} />Qty (Issued)</label>
        </ColumnSelector>

        <ReactToPrint
          trigger={() => <PrintButton>Print Transfer Report</PrintButton>}
          content={() => reportRef.current}
          pageStyle={'@page { size: auto; margin: 20mm; }'}
        />

        <ExportButton onClick={exportExcel}>Export to Excel</ExportButton>
      </ButtonContainer>

      <ReportContainer>
        <TransferReport
          ref={reportRef}
          fromDate={fromDate}
          toDate={toDate}
          visibleColumns={visibleColumns}
        />
      </ReportContainer>
    </Container>
  );
};

export default PrintTransferReport;

