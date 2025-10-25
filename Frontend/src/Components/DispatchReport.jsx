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
    display: none; /* ✅ Hide filters when printing */
  }
`;

const ItemTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-family: Arial, sans-serif;
  table-layout: fixed;

  th, td {
    border: 1px solid #ddd;
    padding: 10px;
    text-align: center;
    overflow-wrap: break-word;
    word-break: break-word;
    font-size: 18px;
  }

  th {
    background-color: #164863;
    color: white;
    font-size: 15px;
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

  @media print {
    th, td {
      font-size: 7px; 
    }
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

// MetaInfo styled component (matching PurchaseReport)
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
    font-size: 17px; /* larger font for UI */
    color: #164863;
  }

  .meta-value {
    font-weight: 500;
    font-size: 17px; /* larger font for UI */
  }

  @media print {
    justify-content: space-between;
    gap: 10px;
    margin: 10px 0 15px 0;

    .meta-label,
    .meta-value {
      font-size: 18px; /* smaller for print */
    }

    div {
      min-width: auto;
      align-items: flex-start;
    }
  }
`;

export const DispatchReport = React.forwardRef(({ fromDate, toDate }, ref) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters (client-side)
  const [selectedItem, setSelectedItem] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  // location id from localStorage
  const [selectedId] = useState(() => {
    return localStorage.getItem('locationid') || '';
  });

  // Load userlocations from sessionStorage to prefer friendly location name
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

  // Fetch data when dates or location change (do NOT refetch on filter changes)
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
        // intentionally NOT sending item_id/subcategory here so we get the full dataset and filter client-side
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

  // Extract unique values for dropdowns (derived from raw data)
  const uniqueItems = [...new Set(data.map(row => row.item_name).filter(Boolean))];
  const uniqueCategories = [...new Set(data.map(row => row.category).filter(Boolean))];

  // Apply client-side filter (fast, reliable)
  const filteredData = data.filter(row => {
    return (
      (selectedItem ? row.item_name === selectedItem : true) &&
      (selectedCategory ? row.category === selectedCategory : true)
    );
  });

  // Determine which columns to show:
  // If an item is selected -> remove item name AND category columns.
  // Else if a category is selected -> remove category only.
  let showItemColumn = true;
  let showCategoryColumn = true;
  if (selectedItem) {
    showItemColumn = false;
    showCategoryColumn = false;
  } else if (selectedCategory) {
    showCategoryColumn = false;
    showItemColumn = true;
  }

  // Columns: compute number of visible columns (used for colspan)
  // Fixed columns count: SNO, Dispatch Date, Quantity, Block Name, Sticker No, Receiver, Incharge, Price, Total
  const baseVisibleCount = 9; // SNO, Dispatch Date, Quantity, Block Name, Sticker No, Receiver, Incharge, Price, Total
  const visibleColumnsCount = baseVisibleCount + (showItemColumn ? 1 : 0) + (showCategoryColumn ? 1 : 0);

  // Compute grand total (sum of 'total' field returned by backend). Use numeric safe sum
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

      {/* MetaInfo */}
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

      {/* Dropdown filters */}
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
            <th style={{width:"70px"}}>SNO</th>
            <th>Dispatch Date</th>
            {showItemColumn && <th>Item Name</th>}
            {showCategoryColumn && <th>Category</th>}
            <th>Quantity</th>
            <th>Block Name</th>
            <th>Sticker No</th>
            <th>Receiver</th>
            <th>Incharge</th>
            <th>Price</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {filteredData.length > 0 ? (
            filteredData.map((row, index) => (
              <tr key={index}>
                <td>{index+1}</td>
                <td>{formatDate(row.dispatch_date)}</td>
                {showItemColumn && <td style={{ textAlign: 'left' }}>{row.item_name || '—'}</td>}
                {showCategoryColumn && <td>{row.category || '—'}</td>}
                <td>{Number(row.quantity) || 0}</td>
                <td>{row.block_name || '—'}</td>
                <td>{row.sticker_no || '—'}</td>
                <td>{row.receiver || '—'}</td>
                <td>{row.incharge || '—'}</td>
                <td>{formatCurrency(row.price)}</td>
                <td>{formatCurrency(row.total)}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={visibleColumnsCount} style={{ textAlign: 'center' }}>No data available</td>
            </tr>
          )}

          {/* End of Report + Grand Total row */}
          <tr>
            {/* We reserve last two columns for GRAND TOTAL label and value */}
            <td colSpan={Math.max(1, visibleColumnsCount - 2)} style={{ textAlign: "left", fontWeight: "bold", paddingLeft: 12 }}>
              END OF REPORT
            </td>
            <td style={{ textAlign: "right", fontWeight: "bold", paddingRight: 12 }}>GRAND TOTAL</td>
            <td style={{ fontWeight: "bold" }}>{formatCurrency(grandTotalAmount)}</td>
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
