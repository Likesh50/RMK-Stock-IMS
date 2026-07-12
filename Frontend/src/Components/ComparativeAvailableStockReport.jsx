import React, { useEffect, useMemo, useRef, useState } from 'react';
import ReactToPrint from 'react-to-print';
import styled from 'styled-components';
import Axios from 'axios';
import Logo from '../assets/Logo.png';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const PageWrapper = styled.div`
  min-height: 100vh;
  padding: 20px 24px 40px;
  background: #f7fbff;
  color: #164863;
  font-family: 'Helvetica Neue', Arial, sans-serif;

  @media print {
    margin: 0;
    padding: 12mm;
    background: white;
  }
`;

const ButtonRow = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 16px;
  margin-bottom: 20px;
  @media print {
    display: none;
  }
`;

const ActionButton = styled.button`
  background-color: #3582ab;
  border: none;
  color: white;
  padding: 10px 18px;
  font-size: 14px;
  border-radius: 8px;
  cursor: pointer;
  min-width: 160px;
`;

const ReportHeader = styled.div`
  text-align: center;
  margin-bottom: 16px;
`;

const Title = styled.h1`
  margin: 0;
  font-size: 22px;
  color: #164863;
`;

const MetaRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 20px;
  margin-bottom: 20px;
  flex-wrap: wrap;
`;

const MetaBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 220px;

  .label {
    font-weight: 700;
    font-size: 14px;
    color: #164863;
  }

  .value {
    font-weight: 500;
    font-size: 14px;
    color: #1b3d5a;
    word-break: break-word;
  }
`;

const LocationChips = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 6px;

  span {
    display: inline-flex;
    align-items: center;
    padding: 6px 10px;
    border-radius: 999px;
    background: #e5f2ff;
    color: #164863;
    font-size: 13px;
    line-height: 1.2;
  }
`;

const TableWrapper = styled.div`
  overflow-x: auto;
  background: white;
  border: 1px solid #dce8f2;
  border-radius: 10px;
  padding: 10px;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  table-layout: auto;
  min-width: 920px;

  thead th {
    background-color: #3582ab;
    color: white;
    padding: 10px 12px;
    font-size: 14px;
    font-weight: 700;
    border: 1px solid #dce8f2;
    text-align: left;
  }

  th, td {
    border: 1px solid #dce8f2;
    padding: 10px 12px;
    font-size: 13px;
    vertical-align: middle;
  }

  tbody tr:nth-child(even) {
    background: #f6fbff;
  }

  tbody tr:hover {
    background: #eef7ff;    
  }

  td.center, th.center {
    text-align: center;
  }

  td.right, th.right {
    text-align: right;
  }

  td.item, th.item {
    white-space: normal;
    overflow-wrap: anywhere;
  }

  @media print {
    min-width: auto;
    thead th {
      font-size: 12px;
    }
    th, td {
      padding: 6px 8px;
      font-size: 11px;
      white-space: normal;
    }
  }
`;

const FooterNote = styled.div`
  margin-top: 20px;
  text-align: right;
  font-size: 13px;
  color: #4d6b88;
`;

const ErrorMessage = styled.div`
  padding: 20px;
  background: #fff2f0;
  border: 1px solid #f4c6bf;
  color: #94332b;
  border-radius: 8px;
  margin-top: 20px;
`;

const ComparativeAvailableStockReport = () => {
  const reportRef = useRef(null);
  const [reportRows, setReportRows] = useState([]);
  const [selectedLocations, setSelectedLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [locationTotals, setLocationTotals] = useState({});
  const [grandTotal, setGrandTotal] = useState(0);

  const formattedDate = useMemo(() => {
    const now = new Date();
    return now.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }, []);

  useEffect(() => {
    const storedIds = sessionStorage.getItem('comparativeSelectedLocationIds');
    const storedNames = sessionStorage.getItem('comparativeSelectedLocationNames');
    const locationIds = storedIds ? JSON.parse(storedIds) : [];
    const storedLocationNames = storedNames ? JSON.parse(storedNames) : [];

    if (!Array.isArray(locationIds) || locationIds.length === 0) {
      setError('Select one or more locations on Available Stock and reopen the Comparative Report.');
      setLoading(false);
      return;
    }

    const queryString = `location_ids=${locationIds.map(id => encodeURIComponent(id)).join(',')}`;
    const url = `${import.meta.env.VITE_RMK_MESS_URL}/report/comparativeAvailableStock?${queryString}`;

    const fetchReport = async () => {
      try {
        setLoading(true);
        const response = await Axios.get(url);
        const payload = response.data;

        if (!payload?.success) {
          throw new Error(payload?.message || 'Failed to fetch comparative report.');
        }

        setReportRows(Array.isArray(payload.data) ? payload.data : []);
        setSelectedLocations(Array.isArray(payload.selectedLocations) && payload.selectedLocations.length > 0
          ? payload.selectedLocations
          : storedLocationNames.map((name, index) => ({ location_id: locationIds[index], location_name: name }))
        );

        setLocationTotals(payload.summary?.locationTotals || {});
        setGrandTotal(Number(payload.summary?.grandTotal || 0));
      } catch (fetchError) {
        console.error('Error fetching comparative report:', fetchError);
        setError(fetchError.message || 'Unable to load comparative report.');
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, []);

  const formatNumber = (value) => {
    const num = Number(value);
    if (Number.isNaN(num)) return '0';
    return num.toFixed(0);
  };

  const formatCurrency = (value) => {
    const num = Number(value) || 0;
    return num.toFixed(2);
  };

  const exportToExcel = () => {
    if (!reportRef.current) return;
    const table = reportRef.current.querySelector('table');
    if (!table) {
      alert('No table found to export');
      return;
    }

    try {
      const ws = XLSX.utils.table_to_sheet(table);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Comparative Available Stock');
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      saveAs(new Blob([wbout], { type: 'application/octet-stream' }), 'ComparativeAvailableStock.xlsx');
    } catch (err) {
      console.error('Export failed', err);
      alert('Export failed. See console for details.');
    }
  };

  const printLabel = `Comparative Report Available Stock`;

  const sortedRows = useMemo(() => {
    return [...reportRows].sort((a, b) => {
      const cat = (a.category || '').toString().localeCompare((b.category || '').toString());
      if (cat !== 0) return cat;
      const sub = (a.sub_category || '').toString().localeCompare((b.sub_category || '').toString());
      if (sub !== 0) return sub;
      return (a.item_name || '').toString().localeCompare((b.item_name || '').toString());
    });
  }, [reportRows]);

  return (
    <PageWrapper>
      <ButtonRow>
        <ReactToPrint
          trigger={() => <ActionButton>Print Comparative Report</ActionButton>}
          content={() => reportRef.current}
          pageStyle={`@page { margin: 12mm; } @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }`}
        />
        <ActionButton onClick={exportToExcel}>Export to Excel</ActionButton>
      </ButtonRow>

      <div ref={reportRef}>
        <ReportHeader>
          <Title>Comparative Report Available Stock</Title>
        </ReportHeader>

        <MetaRow>
          <MetaBlock>
            <span className="label">Generated Date</span>
            <span className="value">{formattedDate}</span>
          </MetaBlock>

          <MetaBlock>
            <span className="label">Selected Locations</span>
            <LocationChips>
              {selectedLocations.length > 0 ? (
                selectedLocations.map((loc) => (
                  <span key={loc.location_id}>{loc.location_name}</span>
                ))
              ) : (
                <span>None</span>
              )}
            </LocationChips>
          </MetaBlock>
        </MetaRow>

        {loading ? (
          <div>Loading comparative report...</div>
        ) : error ? (
          <ErrorMessage>{error}</ErrorMessage>
        ) : (
          <TableWrapper>
            <Table>
              <thead>
                <tr>
                  <th className="sno">S.No</th>
                  <th className="item">Item Name</th>
                  <th>Sub Category</th>
                  <th>Category</th>
                  {selectedLocations.map((loc) => (
                    <th key={loc.location_id} className="center">{loc.location_name}</th>
                  ))}
                  <th className="right">Price</th>
                  <th className="right">Total</th>
                </tr>
              </thead>
              <tbody>
                {sortedRows.length === 0 ? (
                  <tr>
                    <td colSpan={4 + selectedLocations.length + 2} style={{ textAlign: 'center', padding: '20px' }}>
                      No comparative stock data available for selected locations.
                    </td>
                  </tr>
                ) : (
                  sortedRows.map((row, index) => (
                    <tr key={row.item_id || index}>
                      <td className="center">{index + 1}</td>
                      <td className="item">{row.item_name || '-'}</td>
                      <td>{row.sub_category || '-'}</td>
                      <td>{row.category || '-'}</td>
                      {selectedLocations.map((loc) => {
                        const quantity = Number(row[loc.location_name]) || 0;
                        return (
                          <td key={loc.location_id} className="center">
                            {quantity > 0 && row.unit ? `${quantity} ${row.unit}` : '0'}
                          </td>
                        );
                      })}
                      <td className="right">{formatCurrency(row.price)}</td>
                      <td className="right">{formatCurrency(row.total)}</td>
                    </tr>
                  ))
                )}

                {sortedRows.length > 0 && (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'right', fontWeight: 700, background: '#f3f9ff' }}>
                      Total
                    </td>
                    {selectedLocations.map((loc) => (
                      <td key={loc.location_id} className="center" style={{ fontWeight: 700, background: '#f3f9ff' }}>
                        {formatNumber(locationTotals[loc.location_name] || 0)}
                      </td>
                    ))}
                    <td style={{ background: '#f3f9ff' }}></td>
                    <td className="right" style={{ fontWeight: 700, background: '#f3f9ff' }}>
                      {formatCurrency(grandTotal)}
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </TableWrapper>
        )}
      </div>

      <FooterNote>{printLabel}</FooterNote>
    </PageWrapper>
  );
};

export default ComparativeAvailableStockReport;
