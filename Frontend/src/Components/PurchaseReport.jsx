import React from 'react';
import axios from 'axios';
import { useState, useEffect } from 'react';
import styled from 'styled-components';
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
`;

/* Filters */
const FilterContainer = styled.div`
  display: flex;
  justify-content: flex-start;
  gap: 20px;
  margin-bottom: 20px;

  label {
    font-size: 16px;
    font-weight: 700;
    color: #164863;
  }

  select {
    padding: 6px 8px;
    border-radius: 4px;
    border: 1px solid #ccc;
    min-width: 180px;
    font-size: 14px;
  }

  @media print {
    display: none;
  }
`;

/* Table */
const ItemTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-family: 'Helvetica Neue', Arial, sans-serif;
  table-layout: fixed;
  background: white;

  thead th {
    position: sticky;
    top: 0;
    z-index: 2;
    background-color: #164863;
    color: #fff;
    padding: 12px;
    font-size: 14px;
    font-weight: 700;
    border-bottom: 2px solid rgba(0,0,0,0.08);
  }

  th, td {
    border: 1px solid #e6e6e6;
    padding: 12px 10px;
    vertical-align: middle; /* key: vertically center */
    font-size: 15px;
    overflow-wrap: break-word;
    word-break: break-word;
  }

  tbody tr {
    background-color: #fff;
  }

  tbody tr:nth-child(even) {
    background-color: #fbfbfb;
  }

  tbody tr:hover {
    background-color: #f1fbff;
  }

  /* column classes for alignment */
  td.left, th.left { text-align: left; }
  td.center, th.center { text-align: center; }
  td.right, th.right { text-align: right; }

  /* column width hints (min-widths keep layout stable) */
  th.sno { width: 60px; min-width: 60px; }
  th.date { width: 120px; min-width: 110px; }
  th.shop { width: 220px; min-width: 150px; }
  th.item { width: 300px; min-width: 150px; }
  th.category { width: 160px; min-width: 120px; }
  th.qty { width: 80px; min-width: 60px; }
  th.price { width: 100px; min-width: 80px; }
  th.total { width: 120px; min-width: 100px; }

  @media print {
    th, td { font-size: 11px; padding: 6px; }
    thead th { position: static; } /* avoid sticky in print */
  }
`;

/* Meta section */
const MetaInfo = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 40px;
  margin: 20px 0 20px 0;
  color: #164863;
  text-align: left;

  div {
    display: flex;
    flex-direction: column;
    min-width: 160px;
  }

  .meta-label {
    font-weight: 700;
    font-size: 16px;
    color: #164863;
  }

  .meta-value {
    font-weight: 500;
    font-size: 16px;
  }

  @media print {
    gap: 10px;
    margin: 10px 0 10px 0;
    .meta-label, .meta-value { font-size: 20px; }
  }
`;

const DateRange = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
  h2 { margin: 0; font-size: 16px; color: #333; }
`;

const PrintHeader = styled.div`
  display: none;
  text-align: center;
  margin-bottom: 10px;
  img { width: 150px; height: auto; margin-bottom: 6px; }
  h1 { font-size: 24px; }

  @media print { display: block; }
`;

const Footer = styled.footer`
  text-align: center;
  padding: 10px;
  background-color: #164863;
  color: white;
  display: none;
  margin-top: 12px;
  @media print { display: block; }
`;

// Institution name mapping
const institutionMap = {
  RMKEC: "R.M.K. Engineering College",
  RMD: "R.M.D. Engineering College",
  RMKCET: "R.M.K. College of Engg. & Technology",
  "RMK Residential school": "R.M.K. Residential School",
  "RMK Patashala": "R.M.K. Patashala"
};

export const PurchaseReport = React.forwardRef(({ fromDate, toDate }, ref) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Dropdown state
  const [selectedItem, setSelectedItem] = useState('');
  const [selectedSubcategory, setSelectedSubcategory] = useState('');

  // Pull locationid from localStorage
  const [selectedId] = useState(() => {
    return localStorage.getItem('locationid') || '';
  });

  // Locations loaded from sessionStorage (userlocations)
  const [locations, setLocations] = useState([]);
  useEffect(() => {
    const stored = sessionStorage.getItem('userlocations');
    if (stored) {
      try {
        setLocations(JSON.parse(stored));
      } catch (err) {
        console.error('Invalid JSON in sessionStorage for userlocations:', err);
      }
    }
  }, []);

  // Derive selected location name from the locations array (fallbacks handled below)
  const selectedLocationNameFromSession = locations.find(
    loc => String(loc.location_id) === String(selectedId)
  )?.location_name || '';

  // Backend-returned grand total (fallback to computed if absent)
  const [backendGrandTotal, setBackendGrandTotal] = useState(null);

  useEffect(() => {
    if (!selectedId) {
      console.warn("No locationid found in localStorage");
      setLoading(false);
      return;
    }

    setLoading(true);
    axios.get(`${import.meta.env.VITE_RMK_MESS_URL}/report/purchaseReport`, {
      params: {
        startDate: fromDate,
        endDate: toDate,
        location_id: selectedId
      }
    })
    .then(res => {
      const resp = res.data;
      const rows = Array.isArray(resp.data) ? resp.data : [];
      // Normalize numbers
      const normalized = rows.map(r => ({
        ...r,
        quantity: Number(r.quantity) || 0,
        price: Number(r.price || r.amount) || 0,
        total: Number(r.total) || (Number(r.quantity || 0) * Number(r.price || r.amount || 0))
      }));
      setData(normalized);
      if (typeof resp.grandTotal !== 'undefined' && resp.grandTotal !== null) {
        setBackendGrandTotal(Number(resp.grandTotal));
      } else {
        setBackendGrandTotal(null);
      }
      setLoading(false);
    })
    .catch(err => {
      console.error("Error fetching report data:", err);
      setLoading(false);
    });
  }, [fromDate, toDate, selectedId]);

  const formatNumber = (number) => {
    return Number(number).toFixed(2);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date)) return dateString;
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  // Unique items and categories for filters
  const uniqueItems = [...new Set(data.map(row => row.item_name))];
  const uniqueSubcategories = [...new Set(data.map(row => row.category))];

  // Filtering
  const filteredData = data.filter(row => {
    return (
      (selectedItem ? row.item_name === selectedItem : true) &&
      (selectedSubcategory ? row.category === selectedSubcategory : true)
    );
  });

  // Compute grand total if backend didn't provide it
  const computedGrandTotal = filteredData.reduce((sum, row) => sum + (Number(row.total) || (Number(row.quantity || 0) * Number(row.price || 0))), 0);
  const grandTotalToShow = (backendGrandTotal !== null) ? backendGrandTotal : computedGrandTotal;

  // Determine institution name:
  const locationnameKey = localStorage.getItem('locationname') || '';
  const institutionName = selectedLocationNameFromSession || (institutionMap[locationnameKey] || locationnameKey);

  // Determine which columns to show
  const showItemColumn = !selectedItem;
  const showCategoryColumn = !selectedItem && !selectedSubcategory;

  // Visible columns count for colspan logic:
  // Base columns: SL.NO, DATE, SHOP NAME, QTY, PRICE, TOTAL = 6 always visible
  const baseCols = 6;
  const visibleCols = baseCols + (showItemColumn ? 1 : 0) + (showCategoryColumn ? 1 : 0);

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
        <img src={Logo} alt="Logo" />
        <h1>INVENTORY MANAGEMENT SYSTEM</h1>
      </PrintHeader>

      <div style={{ textAlign: 'center', marginBottom: 8 }}>
        <h1 style={{ margin: 0 }}>Purchase Report</h1>
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
            {uniqueItems.map((item, i) => (
              <option key={i} value={item}>{item}</option>
            ))}
          </select>
        </div>

        <div>
          <label>Subcategory: </label>
          <select value={selectedSubcategory} onChange={(e) => setSelectedSubcategory(e.target.value)}>
            <option value="">All</option>
            {uniqueSubcategories.map((cat, i) => (
              <option key={i} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </FilterContainer>

      <ItemTable>
        <thead>
          <tr>
            <th className="sno center">SL.NO</th>
            <th className="date center">DATE</th>
            <th className="shop left">SHOP NAME</th>
            {showItemColumn && <th className="item left">ITEM NAME</th>}
            {showCategoryColumn && <th className="category left">CATEGORY</th>}
            <th className="qty right">QTY</th>
            <th className="price right">PRICE</th>
            <th className="total right">TOTAL</th>
          </tr>
        </thead>

        <tbody>
          {filteredData.length > 0 ? (
            filteredData.map((row, index) => (
              <tr key={index}>
                <td className="center">{index + 1}</td>
                <td className="center">{formatDate(row.purchase_date)}</td>
                <td className="left">{row.shop_name || '—'}</td>
                {showItemColumn && <td className="left">{row.item_name || '—'}</td>}
                {showCategoryColumn && <td className="left">{row.category || '—'}</td>}
                <td className="right">{Number(row.quantity) || 0}</td>
                <td className="right">{formatNumber(row.price)}</td>
                <td className="right">{formatNumber(row.total)}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={visibleCols} style={{ textAlign: 'center', padding: 20 }}>
                No data available
              </td>
            </tr>
          )}

          {/* End of Report + Grand Total row */}
          <tr>
            <td colSpan={Math.max(1, visibleCols - 2)} style={{ textAlign: "left", fontWeight: "700", paddingLeft: 16, background: '#fafafa' }}>
              END OF REPORT
            </td>

            <td colSpan="1" style={{ textAlign: "right", fontWeight: "700", paddingRight: 12, background: '#fafafa' }}>
              GRAND TOTAL
            </td>

            <td style={{ textAlign: "right", fontWeight: "700", paddingRight: 16, background: '#fafafa' }}>
              {formatNumber(grandTotalToShow)}
            </td>
          </tr>
        </tbody>
      </ItemTable>

      <Footer>
        Copyright © 2024. All rights reserved to DEPARTMENT of INFORMATION TECHNOLOGY - RMKEC
      </Footer>
    </Container>
  );
});

export default PurchaseReport;
