import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import axios from 'axios';
import Logo from '../assets/Logo.png';
import { HashLoader } from 'react-spinners';
import GlobalPrintStyles from './createGlobalStyle'; // ensure this file exports a default styled-components GlobalStyle

const Container = styled.div`
  @media print {
    margin: 20px;
  }
  h1 {
    color: #164863;
    text-align: center;
  }
`;

/* ... (keep your existing styled components unchanged) ... */
/* I'll include them verbatim for completeness */

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
    display: none;
  }
`;

const ItemTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-family: Arial, sans-serif;
  table-layout: auto;

  th, td {
    border: 1px solid #ddd;
    padding: 6px 8px;
    text-align: center;
    overflow: hidden;
    font-size: 14px;
    vertical-align: middle;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  th {
    background-color: #164863;
    color: white;
    font-size: 14px;
    font-weight: bold;
  }

  tbody tr { background-color: #f9f9f9; }
  tbody tr:nth-child(even) { background-color: #f1f1f1; }
  tbody tr:hover { background-color: #e0f7fa; color: #000; }

  th.sno, td.sno { width: 65px; min-width: 50px; }
  th.date, td.date { width: 130px; min-width: 100px; }
  th.qty, td.qty { width: 80px; min-width: 60px; }

  th.item, td.item {
    text-align: left;
    padding: 8px 10px;
    white-space: normal;
    overflow-wrap: anywhere;
    word-break: break-word;
    font-size: 15px;
  }

  th.category, td.category,
  th.received_fr, td.received_fr,
  th.issued_to, td.issued_to {
    white-space: normal;
    overflow-wrap: anywhere;
    word-break: break-word;
  }

  @media print {
    thead th { position: static; }
    th, td {
      padding: 4px 6px;
      font-size: 11px;
      white-space: normal;
    }
  }
`;

const DateRange = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
  h2 { margin: 0; font-size: 20px; }
`;

const PrintHeader = styled.div`
  display: none;
  text-align: center;
  margin-bottom: 20px;
  img { width: 150px; height: auto; margin-bottom: 10px; }
  h1 { font-size: 30px; }
  @media print { display: block; }
`;

const Footer = styled.footer`
  text-align: center;
  padding: 10px;
  background-color: #164863;
  color: white;
  margin-top: 0px;
  display: none;
  @media print { display: block; }
`;

const MetaInfo = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 50px;
  margin: 20px 0 30px 0;
  color: #164863;
  text-align: left;

  div { display: flex; flex-direction: column; align-items: flex-start; min-width: 180px; }

  .meta-label { font-weight: 700; font-size: 17px; color: #164863; }
  .meta-value { font-weight: 500; font-size: 17px; }

  @media print {
    justify-content: space-between;
    gap: 10px;
    margin: 10px 0 15px 0;
    .meta-label, .meta-value { font-size: 18px; }
    div { min-width: auto; align-items: flex-start; }
  }
`;

const institutionMap = {
  RMKEC: "R.M.K. Engineering College",
  RMD: "R.M.D. Engineering College",
  RMKCET: "R.M.K. College of Engg. & Technology",
  "RMK Residential school": "R.M.K. Residential School",
  "RMK Patashala": "R.M.K. Patashala"
};

export const TransferReport = React.forwardRef(({ fromDate, toDate, visibleColumns = {} }, ref) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedItem, setSelectedItem] = useState('');
  const [selectedSubcategory, setSelectedSubcategory] = useState('');
  const [selectedFromLocation] = useState(() => localStorage.getItem('locationid') || '');

  // Load userlocations from sessionStorage
  const [locations, setLocations] = useState([]);
  useEffect(() => {
    const stored = sessionStorage.getItem('userlocations');
    if (stored) {
      try { setLocations(JSON.parse(stored)); } catch (err) { console.error(err); }
    }
  }, []);

  const selectedLocationNameFromSession = locations.find(
    loc => String(loc.location_id) === String(selectedFromLocation)
  )?.location_name || '';

  useEffect(() => {
    if (!fromDate || !toDate) {
      setLoading(false);
      setData([]);
      return;
    }
    setLoading(true);

    axios.get(`${import.meta.env.VITE_RMK_MESS_URL}/report/transferReport`, {
      params: {
        startDate: fromDate,
        endDate: toDate,
        from_location_id: selectedFromLocation,
        // keep item/category params optional to allow server-side filtering if you wish
        item_id: selectedItem || undefined,
        category: selectedSubcategory || undefined
      }
    })
    .then(res => {
      const resp = res.data;
      const rows = Array.isArray(resp.data) ? resp.data : [];
      setData(rows);
      setLoading(false);
    })
    .catch(() => {
      setData([]);
      setLoading(false);
    });
  }, [fromDate, toDate, selectedItem, selectedSubcategory, selectedFromLocation]);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date)) return dateString;
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const uniqueItems = [...new Set(data.map(row => row.item_name).filter(Boolean))];
  const uniqueSubcategories = [...new Set(data.map(row => row.category).filter(Boolean))];

  // Institution name resolution:
  const locationnameKey = localStorage.getItem('locationname') || '';
  const institutionName = selectedLocationNameFromSession || (institutionMap[locationnameKey] || locationnameKey);

  // columns defaults
  const columns = {
    sno: visibleColumns.sno !== undefined ? visibleColumns.sno : true,
    date: visibleColumns.date !== undefined ? visibleColumns.date : true,
    item: visibleColumns.item !== undefined ? visibleColumns.item : true,
    category: visibleColumns.category !== undefined ? visibleColumns.category : true,
    received_fr: visibleColumns.received_fr !== undefined ? visibleColumns.received_fr : true,
    qty_received: visibleColumns.qty_received !== undefined ? visibleColumns.qty_received : true,
    issued_to: visibleColumns.issued_to !== undefined ? visibleColumns.issued_to : true,
    qty_issued: visibleColumns.qty_issued !== undefined ? visibleColumns.qty_issued : true
  };

  // behavior when filters selected
  let showItem = columns.item;
  let showCategory = columns.category;
  if (selectedItem) {
    showItem = false;
    showCategory = false;
  } else if (selectedSubcategory) {
    showCategory = false;
  }

  const finalColumns = {
    sno: columns.sno,
    date: columns.date,
    item: showItem,
    category: showCategory,
    received_fr: columns.received_fr,
    qty_received: columns.qty_received,
    issued_to: columns.issued_to,
    qty_issued: columns.qty_issued
  };

  const visibleCount = Object.values(finalColumns).filter(Boolean).length;

  const filteredData = data.filter(row => {
    return (
      (selectedItem ? row.item_name === selectedItem : true) &&
      (selectedSubcategory ? row.category === selectedSubcategory : true)
    );
  });

  // Render: include GlobalPrintStyles always so print styles are available
  return (
    <>
      <GlobalPrintStyles />

      {loading ? (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          backgroundColor: 'rgba(255,255,255,0.7)'
        }}>
          <HashLoader color="#164863" loading={loading} size={90} />
        </div>
      ) : (
        <Container ref={ref} className="print-container">
          <PrintHeader>
            <img src={Logo} alt="Logo" />
            <h1>INVENTORY MANAGEMENT SYSTEM</h1>
          </PrintHeader>

          <div style={{ textAlign: 'center' }}>
            <h1 style={{ margin: 0 }}>Stock Transfer</h1>
          </div>

          <MetaInfo>
            <div>
              <span className="meta-label">Institution</span>
              <span className="meta-value">{institutionName || '—'}</span>
            </div>
            <div>
              <span className="meta-label">Report Date</span>
              <span className="meta-value">{formatDate(new Date().toISOString())}</span>
            </div>
            <div>
              <span className="meta-label">From</span>
              <span className="meta-value">{formatDate(fromDate)}</span>
            </div>
            <div>
              <span className="meta-label">To</span>
              <span className="meta-value">{formatDate(toDate)}</span>
            </div>
            <div>
              <span className="meta-label">Item</span>
              <span className="meta-value">{selectedItem || 'All'}</span>
            </div>
            <div>
              <span className="meta-label">Category</span>
              <span className="meta-value">{selectedSubcategory || 'All'}</span>
            </div>
          </MetaInfo>

          <DateRange>
            <h2 style={{ visibility: 'hidden' }}>From: {formatDate(fromDate)}</h2>
            <h2 style={{ visibility: 'hidden' }}>To: {formatDate(toDate)}</h2>
          </DateRange>

          <FilterContainer>
            <div>
              <label>Item: </label>
              <select value={selectedItem} onChange={(e) => setSelectedItem(e.target.value)}>
                <option value="">All</option>
                {uniqueItems.map((item, i) => <option key={i} value={item}>{item}</option>)}
              </select>
            </div>
            <div>
              <label>Subcategory: </label>
              <select value={selectedSubcategory} onChange={(e) => setSelectedSubcategory(e.target.value)}>
                <option value="">All</option>
                {uniqueSubcategories.map((cat, i) => <option key={i} value={cat}>{cat}</option>)}
              </select>
            </div>
          </FilterContainer>

          <ItemTable>
            <thead>
              <tr>
                {finalColumns.sno && <th className="sno">SL.NO</th>}
                {finalColumns.date && <th className="date">DATE</th>}
                {finalColumns.item && <th className="item">ITEM NAME</th>}
                {finalColumns.category && <th className="category">CATEGORY</th>}
                {finalColumns.received_fr && <th className="received_fr">RECEIVED FROM</th>}
                {finalColumns.qty_received && <th className="qty">QTY</th>}
                {finalColumns.issued_to && <th className="issued_to">ISSUED TO</th>}
                {finalColumns.qty_issued && <th className="qty">QTY</th>}
              </tr>
            </thead>

            <tbody>
              {filteredData.length > 0 ? (
                filteredData.map((row, index) => (
                  <tr key={index}>
                    {finalColumns.sno && <td className="sno">{index + 1}</td>}
                    {finalColumns.date && <td className="date">{formatDate(row.transfer_date)}</td>}
                    {finalColumns.item && <td className="item">{row.item_name || '—'}</td>}
                    {finalColumns.category && <td className="category">{row.category || '—'}</td>}
                    {finalColumns.received_fr && <td className="received_fr">{row.received_fr || '—'}</td>}
                    {finalColumns.qty_received && <td className="qty">{row.qty_received || 0}</td>}
                    {finalColumns.issued_to && <td className="issued_to">{row.issued_to || '—'}</td>}
                    {finalColumns.qty_issued && <td className="qty">{row.qty_issued || 0}</td>}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={Math.max(1, visibleCount)} style={{ textAlign: 'center' }}>No data available</td>
                </tr>
              )}
            </tbody>
          </ItemTable>

          <Footer>
            Copyright © 2024. All rights reserved to DEPARTMENT of INFORMATION TECHNOLOGY - RMKEC
          </Footer>
        </Container>
      )}
    </>
  );
});

export default TransferReport;
