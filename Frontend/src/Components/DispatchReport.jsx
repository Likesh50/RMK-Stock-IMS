import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import Axios from 'axios';
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
  height: 100%;
`;

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
    display: none; /* hide filters in print */
  }
`;

const ItemTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-family: Arial, sans-serif;

  /* Use auto layout so item column can expand naturally */
  table-layout: auto;

  /* small padding for most cells to preserve horizontal room */
  th, td {
    border: 1px solid #ddd;
    padding: 6px 6px;           /* <-- reduced padding for compact cells */
    text-align: center;
    overflow: hidden;
    font-size: 14px;
    vertical-align: middle;
    white-space: nowrap;        /* default: keep other columns single-line */
    text-overflow: ellipsis;
  }

  th {
    background-color: #164863;
    color: white;
    font-size: 14px;
    font-weight: bold;
  }

  tbody tr {
    background-color: #f9f9f9;
  }

  tbody tr:nth-child(even) {
    background-color: #f1f1f1;
  }

  tbody tr:hover {
    background-color: #e0f7fa;
    color: #000;
  }

  /* Narrow fixed-ish columns - keep these compact */
  th.sno, td.sno { width: 60px; min-width: 50px; }        /* serial */
  th.date, td.date { width: 110px; min-width: 90px; }     /* date */
  th.qty, td.qty { width: 80px; min-width: 60px; }        /* quantity */
  th.price, td.price { width: 90px; min-width: 70px; }    /* price */
  th.total, td.total { width: 100px; min-width: 80px; }   /* total */

  /* ITEM column: allow it to expand and wrap as needed */
  th.item, td.item {
    text-align: left;
    padding: 8px 10px;           /* slightly larger padding for item column */
    white-space: normal;         /* allow wrap for long item names */
    overflow-wrap: anywhere;
    word-break: break-word;
    font-size: 14px;
  }

  /* For other text-heavy columns (block_name, receiver), allow wrapping but keep small padding */
  td.block_name, th.block_name,
  td.receiver, th.receiver {
    white-space: normal;
    overflow-wrap: anywhere;
    word-break: break-word;
    padding: 6px 8px;
  }

  /* On print, make font a bit smaller but allow wrapping to avoid truncation */
  @media print {
    th, td {
      padding: 4px 6px;
      font-size: 11px;
      white-space: normal;
    }
    thead th { position: static; } /* avoid sticky in print */
  }
`;


const DateRange = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;

  h2 {
    margin: 0;
    font-size: 20px;
  }
`;

const PrintHeader = styled.div`
  display: none;
  text-align: center;
  margin-bottom: 20px;

  img {
    width: 150px;
    height: auto;
    margin-bottom: 10px;
  }

  h1 {
    font-size: 30px;
  }

  @media print {
    display: block;
  }
`;

const Footer = styled.footer`
  text-align: center;
  padding: 10px;
  background-color: #164863;
  color: white;
  margin-top: 0px;
  display: none;
  @media print {
    display: block;
  }
`;

// Institution name mapping
const institutionMap = {
  RMKEC: "R.M.K. Engineering College",
  RMD: "R.M.D. Engineering College",
  RMKCET: "R.M.K. College of Engg. & Technology",
  "RMK Residential school": "R.M.K. Residential School",
  "RMK Patashala": "R.M.K. Patashala"
};

const MetaInfo = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 50px;
  margin: 20px 0 30px 0;
  color: #164863;
  text-align: left;

  div {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    min-width: 180px;
  }

  .meta-label {
    font-weight: 700;
    font-size: 17px;
    color: #164863;
  }

  .meta-value {
    font-weight: 500;
    font-size: 17px;
  }

  @media print {
    justify-content: space-between;
    gap: 10px;
    margin: 10px 0 15px 0;

    .meta-label,
    .meta-value {
      font-size: 18px;
    }

    div {
      min-width: auto;
      align-items: flex-start;
    }
  }
`;

/**
 * visibleColumns prop shape (optional):
 * {
 *   sno: true,
 *   dispatchDate: true,
 *   item: true,
 *   category: true,
 *   quantity: true,
 *   block_name: true,
 *   sticker_no: true,
 *   receiver: true,
 *   incharge: true,
 *   price: true,
 *   total: true
 * }
 *
 * Missing keys default to true.
 */
export const DispatchReport = React.forwardRef(({ fromDate, toDate, visibleColumns = {} }, ref) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters (client-side)
  const [selectedItem, setSelectedItem] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  // location id from localStorage
  const [selectedId] = useState(() => {
    return localStorage.getItem('locationid') || '';
  });

  // Load userlocations from sessionStorage
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

  const selectedLocationNameFromSession = locations.find(
    loc => String(loc.location_id) === String(selectedId)
  )?.location_name || '';

  // Fetch data
  useEffect(() => {
    if (!selectedId) {
      console.warn("No locationid found in localStorage");
      setLoading(false);
      return;
    }

    setLoading(true);
    Axios.get(`${import.meta.env.VITE_RMK_MESS_URL}/report/dispatchReport`, {
      params: {
        startDate: fromDate,
        endDate: toDate,
        location_id: selectedId
      }
    })
    .then(res => {
      setData(res.data.data || []);
      setLoading(false);
    })
    .catch(err => {
      console.error("Error fetching report data:", err);
      setLoading(false);
    });
  }, [fromDate, toDate, selectedId]);

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

  const formatCurrency = (val) => {
    const num = Number(val) || 0;
    return num.toFixed(2);
  };

  // Institution name resolution:
  const locationnameKey = localStorage.getItem('locationname') || '';
  const institutionName = selectedLocationNameFromSession || (institutionMap[locationnameKey] || locationnameKey);

  // Extract unique values for dropdowns
  const uniqueItems = [...new Set(data.map(row => row.item_name).filter(Boolean))];
  const uniqueCategories = [...new Set(data.map(row => row.category).filter(Boolean))];

  // Filter client-side
  const filteredData = data.filter(row => {
    return (
      (selectedItem ? row.item_name === selectedItem : true) &&
      (selectedCategory ? row.category === selectedCategory : true)
    );
  });

  // columns default (all true)
  const columns = {
    sno: visibleColumns.sno !== undefined ? visibleColumns.sno : true,
    dispatchDate: visibleColumns.dispatchDate !== undefined ? visibleColumns.dispatchDate : true,
    item: visibleColumns.item !== undefined ? visibleColumns.item : true,
    category: visibleColumns.category !== undefined ? visibleColumns.category : true,
    quantity: visibleColumns.quantity !== undefined ? visibleColumns.quantity : true,
    block_name: visibleColumns.block_name !== undefined ? visibleColumns.block_name : true,
    sticker_no: visibleColumns.sticker_no !== undefined ? visibleColumns.sticker_no : true,
    receiver: visibleColumns.receiver !== undefined ? visibleColumns.receiver : true,
    incharge: visibleColumns.incharge !== undefined ? visibleColumns.incharge : true,
    price: visibleColumns.price !== undefined ? visibleColumns.price : true,
    total: visibleColumns.total !== undefined ? visibleColumns.total : true
  };

  // If an item is selected -> hide item and category columns (existing behavior).
  // If category selected -> hide category column only.
  // But if visibleColumns explicitly set, respect that toggle first, then apply filter logic to hide duplicates:
  let showItemColumn = columns.item;
  let showCategoryColumn = columns.category;

  if (selectedItem) {
    showItemColumn = false;
    showCategoryColumn = false;
  } else if (selectedCategory) {
    showCategoryColumn = false;
    // keep item column as per columns.item
  }

  // Build final columns map used for rendering
  const finalColumns = {
    sno: columns.sno,
    dispatchDate: columns.dispatchDate,
    item: showItemColumn,
    category: showCategoryColumn,
    quantity: columns.quantity,
    block_name: columns.block_name,
    sticker_no: columns.sticker_no,
    receiver: columns.receiver,
    incharge: columns.incharge,
    price: columns.price,
    total: columns.total
  };

  // Count visible columns for colspan calculations
  const visibleCount = Object.values(finalColumns).filter(Boolean).length;

  // Compute grand total (sum of 'total' field)
  const grandTotalAmount = filteredData.reduce((sum, row) => sum + (Number(row.total) || 0), 0);

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

      <div style={{ textAlign: 'center' }}>
        <h1 style={{ margin: 0 }}>Dispatch Report</h1>
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
          <span className="meta-value">{selectedCategory || 'All'}</span>
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
          <label>Category: </label>
          <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
            <option value="">All</option>
            {uniqueCategories.map((cat, i) => (
              <option key={i} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </FilterContainer>

      <ItemTable>
        <thead>
          <tr>
            {finalColumns.sno && <th style={{ width: "70px" }}>SNO</th>}
            {finalColumns.dispatchDate && <th>Dispatch Date</th>}
            {finalColumns.item && <th>Item Name</th>}
            {finalColumns.category && <th>Category</th>}
            {finalColumns.quantity && <th>Quantity</th>}
            {finalColumns.block_name && <th>Block Name</th>}
            {finalColumns.sticker_no && <th>Sticker No</th>}
            {finalColumns.receiver && <th>Receiver</th>}
            {finalColumns.incharge && <th>Incharge</th>}
            {finalColumns.price && <th>Price</th>}
            {finalColumns.total && <th>Total</th>}
          </tr>
        </thead>
        <tbody>
          {filteredData.length > 0 ? (
            filteredData.map((row, index) => (
              <tr key={index}>
                {finalColumns.sno && <td>{index + 1}</td>}
                {finalColumns.dispatchDate && <td>{formatDate(row.dispatch_date)}</td>}
                {finalColumns.item && <td style={{ textAlign: 'left' }}>{row.item_name || '—'}</td>}
                {finalColumns.category && <td>{row.category || '—'}</td>}
                {finalColumns.quantity && <td>{Number(row.quantity) || 0}</td>}
                {finalColumns.block_name && <td>{row.block_name || '—'}</td>}
                {finalColumns.sticker_no && <td>{row.sticker_no || '—'}</td>}
                {finalColumns.receiver && <td>{row.receiver || '—'}</td>}
                {finalColumns.incharge && <td>{row.incharge || '—'}</td>}
                {finalColumns.price && <td>{formatCurrency(row.price)}</td>}
                {finalColumns.total && <td>{formatCurrency(row.total)}</td>}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={Math.max(1, visibleCount)} style={{ textAlign: 'center' }}>No data available</td>
            </tr>
          )}

          {/* End of Report + Grand Total row */}
          <tr>
            <td colSpan={Math.max(1, visibleCount - 2)} style={{ textAlign: "left", fontWeight: "bold", paddingLeft: 12 }}>
              END OF REPORT
            </td>

            <td colSpan="1" style={{ textAlign: "right", fontWeight: "bold", paddingRight: 12 }}>
              GRAND TOTAL
            </td>

            <td style={{ fontWeight: "bold" }}>
              {formatCurrency(grandTotalAmount)}
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

export default DispatchReport;
