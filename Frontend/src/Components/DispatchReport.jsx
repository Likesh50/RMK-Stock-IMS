import React, { useEffect, useRef, useState } from 'react';
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
    background-color: #3582ab;;
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

  /* Narrow fixed-ish columns - keep these compact for 11 columns */
  th.sno, td.sno { width: 50px; min-width: 45px; }        /* serial - reduced */
  th.date, td.date { width: 100px; min-width: 85px; }     /* date - reduced */
  th.qty, td.qty { width: 70px; min-width: 55px; }        /* quantity - reduced */
  th.price, td.price { width: 80px; min-width: 65px; }    /* price - reduced */
  th.total, td.total { width: 90px; min-width: 75px; }    /* total - reduced */

  /* CATEGORY column: compact but readable */
  th.category, td.category {
    width: 120px;
    min-width: 100px;
    text-align: left;
    white-space: normal;
    overflow-wrap: break-word;
    word-break: break-word;
    padding: 6px 8px;
  }

  /* ITEM column: allow it to expand and wrap as needed */
  th.item, td.item {
    text-align: left;
    padding: 8px 10px;           /* slightly larger padding for item column */
    white-space: normal;         /* allow wrap for long item names */
    overflow-wrap: anywhere;
    word-break: break-word;
    font-size: 14px;
  }

  /* For other text-heavy columns (block_name, receiver, incharge, sticker_no), allow wrapping but keep small padding */
  td.block_name, th.block_name,
  td.receiver, th.receiver,
  td.incharge, th.incharge,
  td.sticker_no, th.sticker_no {
    white-space: normal;
    overflow-wrap: anywhere;
    word-break: break-word;
    padding: 6px 6px;
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
  background-color: #3582ab;;
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
  const [selectedCategories, setSelectedCategories] = useState([]); // Changed to array for multi-select
  const [selectedBlock, setSelectedBlock] = useState('');

  // 🔹 Location selection (multi-select support)

const [locations, setLocations] = useState([]);
const [selectedLocations, setSelectedLocations] = useState([]);

// Load userlocations from sessionStorage
useEffect(() => {
  const stored = sessionStorage.getItem('userlocations');
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      setLocations(parsed || []);
    } catch (err) {
      console.error('Invalid JSON in sessionStorage for userlocations:', err);
      setLocations([]);
    }
  }
}, []);

const categoryMenuRef = useRef(null);
const [categoryMenuOpen, setCategoryMenuOpen] = useState(false);

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

// Compute display name for header/meta
const selectedLocationNameFromSession =
  selectedLocations.length === 0 ||
  selectedLocations.length === locations.length
    ? "All Locations"
    : selectedLocations
        .map(id =>
          locations.find(loc => String(loc.location_id) === String(id))?.location_name
        )
        .filter(Boolean)
        .join(", ");



  // Fetch data
  useEffect(() => {
  if (!locations.length) return;

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

      for (let loc of locationsToFetch) {
        const res = await Axios.get(
          `${import.meta.env.VITE_RMK_MESS_URL}/report/dispatchReport`,
          {
            params: {
              startDate: fromDate,
              endDate: toDate,
              location_id: loc.location_id
            }
          }
        );

        const rows = (res.data.data || []).map(r => ({
          ...r,
          location_name: loc.location_name
        }));

        combined = [...combined, ...rows];
      }

      setData(combined);

    } catch (err) {
      console.error("Error fetching dispatch report:", err);
    } finally {
      setLoading(false);
    }
  };

  fetchData();
}, [fromDate, toDate, selectedLocations, locations]);



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
  const uniqueCategories = [...new Set(data.map(row => row.category).filter(Boolean))].sort((a, b) => a.localeCompare(b)); // Sort alphabetically
  const uniqueBlocks = [...new Set(
  data.map(row => row.block_name).filter(Boolean)
)].sort((a, b) => a.localeCompare(b)); // Sort alphabetically

  // Filter client-side
  const filteredData = data.filter(row => {
    return (
      (selectedItem ? row.item_name === selectedItem : true) &&
      (selectedCategories.length > 0 ? selectedCategories.includes(row.category) : true) && // Updated for multi-select
      (selectedBlock ? row.block_name === selectedBlock : true)
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
  // Category column should always be visible to show the category for each row
  let showItemColumn = columns.item;
  let showCategoryColumn = true; // Always show category column

  if (selectedItem) {
    showItemColumn = false;
    // Keep category column visible even when item is selected
  }

  // Build final columns map used for rendering
  const finalColumns = {
    sno: columns.sno,
    dispatchDate: columns.dispatchDate,
    item: showItemColumn,
    category: showCategoryColumn, // Always show category column
    quantity: columns.quantity,
    block_name: columns.block_name,
    sticker_no: columns.sticker_no,
    receiver: columns.receiver,
    incharge: columns.incharge,
    price: columns.price,
    total: columns.total
  };

  const allCategoriesSelected =
    uniqueCategories.length > 0 && selectedCategories.length === uniqueCategories.length;

  const selectedCategoryDisplay =
    selectedCategories.length === 0 || allCategoriesSelected
      ? 'All'
      : uniqueCategories.filter(category => selectedCategories.includes(category)).join(', ');

  // Count visible columns for colspan calculations
  const visibleCount = Object.values(finalColumns).filter(Boolean).length;

  // Compute grand total (sum of 'total' field)
  const grandTotalAmount = filteredData.reduce((sum, row) => sum + (Number(row.total) || 0), 0);

  //GROUP DATA BY LOCATION
  const groupedData = filteredData.reduce((acc, row) => {
  const key = row.location_name || "Unknown";
  if (!acc[key]) acc[key] = [];
  acc[key].push(row);
  return acc;
}, {});


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
        <h1 style={{ margin: 0,fontSize:22 }}>Dispatch Report</h1>
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
          <span className="meta-value" title={selectedCategoryDisplay}>
            {selectedCategoryDisplay}
          </span>
        </div>
        <div>
          <span className="meta-label">Block</span>
          <span className="meta-value">{selectedBlock || 'All'}</span>
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
        <div>
          <label>Block: </label>
          <select
            value={selectedBlock}
            onChange={(e) => setSelectedBlock(e.target.value)}
          >
            <option value="">All</option>
            {uniqueBlocks.map((block, i) => (
              <option key={i} value={block}>{block}</option>
            ))}
          </select>
        </div>
        
        <div>
  <label>Location: </label>
  <select
    value=""
    onChange={(e) => {
      const value = e.target.value;

      if (value === "ALL") {
        const allIds = locations.map(loc => String(loc.location_id));
        setSelectedLocations(allIds);
      } else {
        if (selectedLocations.includes(value)) {
          setSelectedLocations(selectedLocations.filter(id => id !== value));
        } else {
          setSelectedLocations([...selectedLocations, value]);
        }
      }
    }}
  >
    <option value="">Select Locations</option>
    <option value="ALL">
      {selectedLocations.length === locations.length ? "✓ All" : "All"}
    </option>

    {locations.map(loc => (
      <option key={loc.location_id} value={loc.location_id}>
        {selectedLocations.includes(String(loc.location_id))
          ? `✓ ${loc.location_name}`
          : loc.location_name}
      </option>
    ))}
  </select>
</div>


</FilterContainer>

{/* LOCATION WISE TABLES */}
{(
  selectedLocations.length === 0
    ? locations.map(loc => loc.location_name)
    : selectedLocations
        .map(id =>
          locations.find(l => String(l.location_id) === String(id))?.location_name
        )
        .filter(Boolean)
).map((locationName, groupIndex) => {

  const rows = (groupedData[locationName] || []).sort((a, b) => {
    const categoryA = (a.category || '').toString();
    const categoryB = (b.category || '').toString();

    if (categoryA !== categoryB) {
      return categoryA.localeCompare(categoryB);
    }

    const dateA = new Date(a.dispatch_date);
    const dateB = new Date(b.dispatch_date);
    return dateA - dateB;
  });

  const locationTotal = rows.reduce(
    (sum, row) => sum + (Number(row.total) || 0),
    0
  );

  return (
    <div key={groupIndex} style={{ marginBottom: 40 }}>

      {/* Location Heading */}
      <h3 style={{ marginTop: 25 }}>
        Location: {locationName}
      </h3>

      <ItemTable>
        <thead>
          <tr>
            {finalColumns.sno && <th>SNO</th>}
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
          {rows.length > 0 ? (
            <>
              {rows.map((row, index) => (
                <tr key={index}>
                  {finalColumns.sno && <td>{index + 1}</td>}
                  {finalColumns.dispatchDate && <td>{formatDate(row.dispatch_date)}</td>}
                  {finalColumns.item && <td>{row.item_name}</td>}
                  {finalColumns.category && <td>{row.category}</td>}
                  {finalColumns.quantity && <td>{row.quantity}</td>}
                  {finalColumns.block_name && <td>{row.block_name}</td>}
                  {finalColumns.sticker_no && <td>{row.sticker_no}</td>}
                  {finalColumns.receiver && <td>{row.receiver}</td>}
                  {finalColumns.incharge && <td>{row.incharge}</td>}
                  {finalColumns.price && <td>{formatCurrency(row.price)}</td>}
                  {finalColumns.total && <td>{formatCurrency(row.total)}</td>}
                </tr>
              ))}

              {/* Location Total */}
              <tr>
                <td colSpan="9" style={{ textAlign: "right", fontWeight: "bold" }}>
                  Total for {locationName}
                </td>
                <td colSpan="2" style={{ fontWeight: "bold" }}>
                  {formatCurrency(locationTotal)}
                </td>
              </tr>
            </>
          ) : (
            <tr>
              <td colSpan="11" style={{ textAlign: "center", fontWeight: "bold" }}>
                NIL
              </td>
            </tr>
          )}
        </tbody>
      </ItemTable>

    </div>
  );
})}

{/* GRAND TOTAL */}
<h3 style={{ textAlign: "right", marginTop: 20 }}>
  GRAND TOTAL: {formatCurrency(grandTotalAmount)}
</h3>

<Footer>
  Copyright © 2024. All rights reserved to DEPARTMENT of INFORMATION TECHNOLOGY - RMKEC
</Footer>
</Container>

  );
});

export default DispatchReport;
