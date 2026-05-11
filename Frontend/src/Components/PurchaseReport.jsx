import React, { useRef } from 'react';
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

const CategoryDropdown = styled.div`
  position: relative;
  min-width: 220px;
`;

const CategoryToggle = styled.button`
  width: 100%;
  text-align: left;
  padding: 8px 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  background: #fff;
  color: #164863;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  gap: 10px;

  &:hover {
    border-color: #4f8ccf;
  }
`;

const CategoryText = styled.span`
  flex: 1;
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
`;

const CategoryMenu = styled.div`
  position: absolute;
  z-index: 10;
  top: calc(100% + 8px);
  left: 0;
  right: 0;
  max-height: 240px;
  overflow-y: auto;
  border: 1px solid rgba(0, 0, 0, 0.15);
  border-radius: 6px;
  background: #fff;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.08);
  padding: 8px 0;
`;

const CategoryOption = styled.label`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 14px;
  cursor: pointer;
  color: #1f3f5b;
  font-size: 14px;

  &:hover {
    background: #f6fbff;
  }

  input {
    accent-color: #164863;
  }
`;

const CategoryFooter = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 14px;
  border-top: 1px solid #eef3f7;
  font-size: 13px;
  color: #5f6d7a;
`;

const LocationDropdown = styled.div`
  position: relative;
  min-width: 220px;
`;

const LocationToggle = styled.button`
  width: 100%;
  text-align: left;
  padding: 8px 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  background: #fff;
  color: #164863;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  gap: 10px;

  &:hover {
    border-color: #4f8ccf;
  }
`;

const LocationMenu = styled.div`
  position: absolute;
  z-index: 10;
  top: calc(100% + 8px);
  left: 0;
  right: 0;
  max-height: 240px;
  overflow-y: auto;
  border: 1px solid rgba(0, 0, 0, 0.15);
  border-radius: 6px;
  background: #fff;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.08);
  padding: 8px 0;
`;

const LocationOption = styled.label`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 14px;
  cursor: pointer;
  color: #1f3f5b;
  font-size: 14px;

  &:hover {
    background: #f6fbff;
  }

  input {
    accent-color: #164863;
  }
`;

const LocationFooter = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 14px;
  border-top: 1px solid #eef3f7;
  font-size: 13px;
  color: #5f6d7a;
`;

/* Table */
/* Replace your current ItemTable with this */
const ItemTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-family: 'Helvetica Neue', Arial, sans-serif;

  /* Let the browser size columns naturally so item can expand */
  table-layout: auto;
  background: white;

  thead th {
    position: sticky;
    top: 0;
    z-index: 2;
    background-color: #3582ab;;
    color: #fff;
    padding: 10px;             /* slightly reduced */
    font-size: 14px;
    font-weight: 700;
    border-bottom: 2px solid rgba(0,0,0,0.08);
  }

  /* default: compact cells (other columns) */
  th, td {
    border: 1px solid #e6e6e6;
    padding: 6px 8px;          /* <- reduced from 12px */
    vertical-align: middle;
    font-size: 14px;
    overflow: hidden;
    white-space: nowrap;       /* keep most columns single-line */
    text-overflow: ellipsis;
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

  /* alignment classes (your JSX already uses these) */
  td.left, th.left { text-align: left; white-space: normal; }
  td.center, th.center { text-align: center; }
  td.right, th.right { text-align: right; }

  /* Narrow / fixed-ish columns to keep them compact */
  th.sno, td.sno { width: 60px; min-width: 48px; }
  th.date, td.date { width: 120px; min-width: 100px; }
  th.qty, td.qty { width: 80px; min-width: 60px; }
  th.price, td.price { width: 100px; min-width: 80px; }
  th.total, td.total { width: 120px; min-width: 100px; }
  th.shop, td.shop { width: 220px; min-width: 120px; } /* keep shop narrower */

  /* ITEM column gets flexible space and wraps when needed */
  th.item, td.item {
    text-align: left;
    padding: 8px 10px;        /* slightly larger for readability */
    white-space: normal;      /* allow wrap for item names */
    overflow-wrap: anywhere;
    word-break: break-word;
    font-size: 15px;
  }

  /* Category or other multi-word columns — allow wrap but stay compact */
  th.category, td.category {
    white-space: normal;
    overflow-wrap: anywhere;
    word-break: break-word;
  }

  /* Print: smaller font, allow wrapping (avoid ellipsis on paper) */
  @media print {
    thead th { position: static; } /* avoid sticky headers in print */
    th, td {
      padding: 4px 6px;
      font-size: 11px;
      white-space: normal;   /* allow full text in print */
    }
  }
`;


/* Meta section */
const MetaInfo = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  row-gap: 15px;
  column-gap: 40px;
  margin: 20px 0 30px 0;
  color: #164863;
  text-align: left;

  div {
    display: flex;
    flex-direction: column;
  }

  .meta-label {
    font-weight: 700;
    font-size: 16px;
    color: #164863;
  }

  .meta-value {
    font-weight: 500;
    font-size: 16px;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  @media print {
    grid-template-columns: repeat(4, 1fr);
    font-size: 14px;
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
  background-color: #3582ab;;
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

export const PurchaseReport = React.forwardRef(({ fromDate, toDate, visibleColumns = {} }, ref) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Dropdown state
  const [selectedItem, setSelectedItem] = useState('');
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedLocations, setSelectedLocations] = useState([]);

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

  const categoryMenuRef = useRef(null);
  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false);

  const locationMenuRef = useRef(null);
  const [locationMenuOpen, setLocationMenuOpen] = useState(false);

  useEffect(() => {
    if (!categoryMenuOpen) return;

    const handleClickOutside = (event) => {
      if (categoryMenuRef.current && !categoryMenuRef.current.contains(event.target)) {
        setCategoryMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [categoryMenuOpen]);

  useEffect(() => {
    if (!locationMenuOpen) return;

    const handleClickOutside = (event) => {
      if (locationMenuRef.current && !locationMenuRef.current.contains(event.target)) {
        setLocationMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [locationMenuOpen]);

  const selectedLocationNameFromSession =
    selectedLocations.length === 0 ||
    selectedLocations.length === locations.length
      ? 'All Locations'
      : selectedLocations
          .map(id =>
            locations.find(loc => String(loc.location_id) === String(id))?.location_name
          )
          .filter(Boolean)
          .join(', ');

  // Backend-returned grand total (fallback to computed if absent)
  const [backendGrandTotal, setBackendGrandTotal] = useState(null);

  useEffect(() => {
    if (!locations.length) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const fetchData = async () => {
      try {
        let combined = [];

        const locationsToFetch =
          selectedLocations.length > 0
            ? locations.filter(loc =>
                selectedLocations.includes(String(loc.location_id))
              )
            : locations;

        for (const loc of locationsToFetch) {
          const res = await axios.get(`${import.meta.env.VITE_RMK_MESS_URL}/report/purchaseReport`, {
            params: {
              startDate: fromDate,
              endDate: toDate,
              location_id: loc.location_id
            }
          });

          const resp = res.data;
          const rows = Array.isArray(resp.data) ? resp.data : [];
          const normalized = rows.map(r => ({
            ...r,
            location_name: loc.location_name,
            quantity: Number(r.quantity) || 0,
            price: Number(r.price || r.amount) || 0,
            total: Number(r.total) || (Number(r.quantity || 0) * Number(r.price || r.amount || 0))
          }));

          combined = [...combined, ...normalized];
        }

        setData(combined);
        setBackendGrandTotal(null);
      } catch (err) {
        console.error("Error fetching report data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [fromDate, toDate, selectedLocations, locations]);

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
  const uniqueItems = [...new Set(data.map(row => row.item_name).filter(Boolean))];
  const uniqueCategories = [...new Set(data.map(row => row.category).filter(Boolean))].sort((a, b) => a.localeCompare(b));

  // Filtering
  const filteredData = data.filter(row => {
    return (
      (selectedItem ? row.item_name === selectedItem : true) &&
      (selectedCategories.length > 0 ? selectedCategories.includes(row.category) : true) &&
      (selectedLocations.length > 0 ? selectedLocations.includes(String(row.location_id)) : true)
    );
  });

  const allCategoriesSelected =
    uniqueCategories.length > 0 && selectedCategories.length === uniqueCategories.length;

  const selectedCategoryDisplay =
    selectedCategories.length === 0 || allCategoriesSelected
      ? 'All'
      : uniqueCategories.filter(category => selectedCategories.includes(category)).join(', ');

  const sortedFilteredData = [...filteredData].sort((a, b) => {
    const categoryCompare = (a.category || '').localeCompare(b.category || '');
    if (categoryCompare !== 0) return categoryCompare;

    const dateA = new Date(a.purchase_date);
    const dateB = new Date(b.purchase_date);
    if (!isNaN(dateA) && !isNaN(dateB) && dateA.getTime() !== dateB.getTime()) {
      return dateA - dateB;
    }

    return (a.item_name || '').localeCompare(b.item_name || '');
  });

  // Compute grand total if backend didn't provide it
  const computedGrandTotal = sortedFilteredData.reduce((sum, row) => sum + (Number(row.total) || (Number(row.quantity || 0) * Number(row.price || 0))), 0);
  const grandTotalToShow = (backendGrandTotal !== null) ? backendGrandTotal : computedGrandTotal;

  const groupedData = filteredData.reduce((acc, row) => {
    const key = row.location_name || 'Unknown';
    if (!acc[key]) acc[key] = [];
    acc[key].push(row);
    return acc;
  }, {});

  // Determine institution name:
  const locationnameKey = localStorage.getItem('locationname') || '';
  const institutionName = selectedLocationNameFromSession || (institutionMap[locationnameKey] || locationnameKey);

  // Determine which columns to show based on visibleColumns prop (default to true)
  const columns = {
    sno: true, // always show serial no
    date: visibleColumns.date !== undefined ? visibleColumns.date : true,
    shop: visibleColumns.shop !== undefined ? visibleColumns.shop : true,
    item: visibleColumns.item !== undefined ? visibleColumns.item : true,
    category: visibleColumns.category !== undefined ? visibleColumns.category : true,
    qty: visibleColumns.qty !== undefined ? visibleColumns.qty : true,
    price: visibleColumns.price !== undefined ? visibleColumns.price : true,
    total: visibleColumns.total !== undefined ? visibleColumns.total : true
  };

  // Visible columns count for colspan logic:
  const visibleCols = Object.values(columns).filter(Boolean).length;

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
        <h1 style={{ margin: 0,fontSize:22 }}>Purchase Report</h1>
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
          <span className="meta-value" title={selectedCategoryDisplay}>{selectedCategoryDisplay}</span>
        </div>
        <div>
          <span className="meta-label">Location</span>
          <span className="meta-value" title={selectedLocationNameFromSession}>{selectedLocationNameFromSession}</span>
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

        <div ref={categoryMenuRef} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <label style={{ margin: 0 }}>Category: </label>
          <CategoryDropdown>
            <CategoryToggle
              type="button"
              onClick={() => setCategoryMenuOpen(prev => !prev)}
              title={selectedCategoryDisplay}
            >
              <CategoryText>{selectedCategoryDisplay}</CategoryText>
              <span>{categoryMenuOpen ? '▴' : '▾'}</span>
            </CategoryToggle>
            {categoryMenuOpen && (
              <CategoryMenu>
                {uniqueCategories.map((cat, i) => (
                  <CategoryOption key={i}>
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(cat)}
                      onChange={() => {
                        setSelectedCategories(prev =>
                          prev.includes(cat)
                            ? prev.filter(item => item !== cat)
                            : [...prev, cat]
                        );
                      }}
                    />
                    <span>{cat}</span>
                  </CategoryOption>
                ))}
                <CategoryFooter>
                  <span>{selectedCategories.length === 0 ? 'Showing all categories' : `${selectedCategories.length} selected`}</span>
                  {selectedCategories.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedCategories([])}
                      style={{
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        padding: '4px 8px',
                        background: '#f8f9fb',
                        color: '#164863',
                        cursor: 'pointer'
                      }}
                    >
                      Clear
                    </button>
                  )}
                </CategoryFooter>
              </CategoryMenu>
            )}
          </CategoryDropdown>
        </div>

        <div ref={locationMenuRef} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <label style={{ margin: 0 }}>Location: </label>
          <LocationDropdown>
            <LocationToggle
              type="button"
              onClick={() => setLocationMenuOpen(prev => !prev)}
            >
              <span>
                {selectedLocations.length === 0
                  ? 'All'
                  : selectedLocations.length === 1
                  ? locations.find(loc => String(loc.location_id) === selectedLocations[0])?.location_name || selectedLocations[0]
                  : selectedLocations
                      .map(id => locations.find(loc => String(loc.location_id) === String(id))?.location_name)
                      .filter(Boolean)
                      .join(', ')}
              </span>
              <span>{locationMenuOpen ? '▴' : '▾'}</span>
            </LocationToggle>
            {locationMenuOpen && (
              <LocationMenu>
                {locations.map((loc) => (
                  <LocationOption key={loc.location_id}>
                    <input
                      type="checkbox"
                      checked={selectedLocations.includes(String(loc.location_id))}
                      onChange={() => {
                        const locId = String(loc.location_id);
                        setSelectedLocations(prev =>
                          prev.includes(locId)
                            ? prev.filter(id => id !== locId)
                            : [...prev, locId]
                        );
                      }}
                    />
                    <span>{loc.location_name}</span>
                  </LocationOption>
                ))}
                <LocationFooter>
                  <span>{selectedLocations.length === 0 ? 'Showing all locations' : `${selectedLocations.length} selected`}</span>
                  {selectedLocations.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedLocations([])}
                      style={{
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        padding: '4px 8px',
                        background: '#f8f9fb',
                        color: '#164863',
                        cursor: 'pointer'
                      }}
                    >
                      Clear
                    </button>
                  )}
                </LocationFooter>
              </LocationMenu>
            )}
          </LocationDropdown>
        </div>
      </FilterContainer>

      {(
        selectedLocations.length === 0
          ? locations.map(loc => loc.location_name)
          : selectedLocations
              .map(id =>
                locations.find(loc => String(loc.location_id) === String(id))?.location_name
              )
              .filter(Boolean)
      ).map((locationName, groupIndex) => {
        const rows = (groupedData[locationName] || []).sort((a, b) => {
          const categoryCompare = (a.category || '').localeCompare(b.category || '');
          if (categoryCompare !== 0) return categoryCompare;

          const dateA = new Date(a.purchase_date);
          const dateB = new Date(b.purchase_date);
          if (!isNaN(dateA) && !isNaN(dateB) && dateA.getTime() !== dateB.getTime()) {
            return dateA - dateB;
          }

          return (a.item_name || '').localeCompare(b.item_name || '');
        });

        const locationTotal = rows.reduce(
          (sum, row) => sum + (Number(row.total) || (Number(row.quantity || 0) * Number(row.price || 0))),
          0
        );

        return (
          <div key={groupIndex} style={{ marginBottom: 40 }}>
            <h3 style={{ marginTop: 25 }}>
              Location: {locationName}
            </h3>

            <ItemTable>
              <thead>
                <tr>
                  {columns.sno && <th className="sno center">SL.NO</th>}
                  {columns.date && <th className="date center">DATE</th>}
                  {columns.shop && <th className="shop left">SHOP NAME</th>}
                  {columns.item && <th className="item left">ITEM NAME</th>}
                  {columns.category && <th className="category left">CATEGORY</th>}
                  {columns.qty && <th className="qty right">QTY</th>}
                  {columns.price && <th className="price right">PRICE</th>}
                  {columns.total && <th className="total right">TOTAL</th>}
                </tr>
              </thead>

              <tbody>
                {rows.length > 0 ? (
                  <>
                    {rows.map((row, index) => (
                      <tr key={index}>
                        {columns.sno && <td className="center">{index + 1}</td>}
                        {columns.date && <td className="center">{formatDate(row.purchase_date)}</td>}
                        {columns.shop && <td className="left">{row.shop_name || '—'}</td>}
                        {columns.item && <td className="left">{row.item_name || '—'}</td>}
                        {columns.category && <td className="left">{row.category || '—'}</td>}
                        {columns.qty && <td className="right">{Number(row.quantity) || 0}</td>}
                        {columns.price && <td className="right">{formatNumber(row.price)}</td>}
                        {columns.total && <td className="right">{formatNumber(row.total)}</td>}
                      </tr>
                    ))}

                    <tr>
                      <td colSpan={Math.max(1, visibleCols - 1)} style={{ textAlign: 'right', fontWeight: '700', paddingRight: 12, background: '#fafafa' }}>
                        Total for {locationName}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: '700', paddingRight: 16, background: '#fafafa' }}>
                        {formatNumber(locationTotal)}
                      </td>
                    </tr>
                  </>
                ) : (
                  <tr>
                    <td colSpan={Math.max(1, visibleCols)} style={{ textAlign: 'center', padding: 20 }}>
                      No data available
                    </td>
                  </tr>
                )}
              </tbody>
            </ItemTable>
          </div>
        );
      })}

      <h3 style={{ textAlign: 'right', marginTop: 20 }}>
        GRAND TOTAL: {formatNumber(grandTotalToShow)}
      </h3>

      {false && (
      <ItemTable>
        <thead>
          <tr>
            {columns.sno && <th className="sno center">SL.NO</th>}
            {columns.date && <th className="date center">DATE</th>}
            {columns.shop && <th className="shop left">SHOP NAME</th>}
            {columns.item && <th className="item left">ITEM NAME</th>}
            {columns.category && <th className="category left">CATEGORY</th>}
            {columns.qty && <th className="qty right">QTY</th>}
            {columns.price && <th className="price right">PRICE</th>}
            {columns.total && <th className="total right">TOTAL</th>}
          </tr>
        </thead>

        <tbody>
          {sortedFilteredData.length > 0 ? (
            sortedFilteredData.map((row, index) => (
              <tr key={index}>
                {columns.sno && <td className="center">{index + 1}</td>}
                {columns.date && <td className="center">{formatDate(row.purchase_date)}</td>}
                {columns.shop && <td className="left">{row.shop_name || '—'}</td>}
                {columns.item && <td className="left">{row.item_name || '—'}</td>}
                {columns.category && <td className="left">{row.category || '—'}</td>}
                {columns.qty && <td className="right">{Number(row.quantity) || 0}</td>}
                {columns.price && <td className="right">{formatNumber(row.price)}</td>}
                {columns.total && <td className="right">{formatNumber(row.total)}</td>}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={Math.max(1, visibleCols)} style={{ textAlign: 'center', padding: 20 }}>
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
      )}

      <Footer>
        Copyright © 2024. All rights reserved to DEPARTMENT of INFORMATION TECHNOLOGY - RMKEC
      </Footer>
    </Container>
  );
});

export default PurchaseReport;
