import React, { useEffect, useState, forwardRef, useRef } from 'react';
import styled from 'styled-components';
import Axios from 'axios';
import moment from 'moment';
import Logo from '../assets/Logo.png';

const Container = styled.div`
  @media print {
    margin: 20px;
  }

  h1 {
    color: #164863;
    text-align: center;
  }
`;

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

const InstitutionDropdown = styled.div`
  position: relative;
  min-width: 220px;
`;

const InstitutionToggle = styled.button`
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

const TableHeader = styled.table`
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
    padding: 10px;
    font-size: 14px;
    font-weight: 700;
    border-bottom: 2px solid rgba(0,0,0,0.08);
  }

  /* default: compact cells (other columns) */
  th, td {
    border: 1px solid #e6e6e6;
    padding: 6px 8px;
    vertical-align: middle;
    font-size: 14px;
    overflow: hidden;
    white-space: nowrap;
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

  /* ITEM column gets flexible space and wraps when needed */
  th.item, td.item {
    text-align: left;
    padding: 8px 10px;
    white-space: normal;
    overflow-wrap: anywhere;
    word-break: break-word;
    font-size: 15px;
  }

  /* Price and Total columns */
  th.price, td.price { width: 100px; min-width: 80px; }
  th.total, td.total { width: 120px; min-width: 100px; }

  /* Category or other multi-word columns — allow wrap but stay compact */
  th.category, td.category {
    white-space: normal;
    overflow-wrap: anywhere;
    word-break: break-word;
  }

  /* Print: smaller font, allow wrapping (avoid ellipsis on paper) */
  @media print {
    thead th { position: static; }
    th, td {
      padding: 4px 6px;
      font-size: 11px;
      white-space: normal;
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

const institutionMap = {
  RMKEC: "R.M.K. Engineering College",
  RMD: "R.M.D. Engineering College",
  RMKCET: "R.M.K. College of Engg. & Technology",
  "RMK Residential school": "R.M.K. Residential School",
  "RMK Patashala": "R.M.K. Patashala"
};

const AvailableStock = forwardRef(({ fromDate, toDate }, ref) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Dropdown state
  const [selectedInstitutions, setSelectedInstitutions] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);

  // Locations loaded from sessionStorage (userlocations)
  const [locations, setLocations] = useState([]);
  const [institutionMenuOpen, setInstitutionMenuOpen] = useState(false);
  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false);

  const institutionMenuRef = useRef(null);
  const categoryMenuRef = useRef(null);

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

  useEffect(() => {
    if (!institutionMenuOpen) return;

    const handleClickOutside = (event) => {
      if (institutionMenuRef.current && !institutionMenuRef.current.contains(event.target)) {
        setInstitutionMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [institutionMenuOpen]);

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
  const selectedInstitutionDisplay =
    selectedInstitutions.length === 0 || selectedInstitutions.length === locations.length
      ? 'All'
      : selectedInstitutions
          .map(id =>
            locations.find(loc => String(loc.location_id) === String(id))?.location_name
          )
          .filter(Boolean)
          .join(', ');

  // Fetch data
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
          selectedInstitutions.length > 0
            ? locations.filter(loc =>
                selectedInstitutions.includes(String(loc.location_id))
              )
            : locations;

        for (const loc of locationsToFetch) {
          const res = await Axios.get(`${import.meta.env.VITE_RMK_MESS_URL}/stocks/availablestock?location_id=${loc.location_id}`);

          const resp = res.data;
          const rows = Array.isArray(resp.data) ? resp.data : [];
          const normalized = rows.map(r => ({
            ...r,
            location_name: loc.location_name,
            quantity: Number(r.quantity) || 0,
            price: Number(r.price) || 0,
            total: Number(r.total) || 0,
          }));

          combined = [...combined, ...normalized];
        }

        // Filter out zero quantity items and add calculated fields
        const nonZero = combined.filter(item => Number(item.quantity) > 0);
        const dataWithCalcs = nonZero.map(stock => ({
          ...stock,
          daysSincePurchase: calculateDaysSince(stock.purchase_date),
          daysLeftToExpire: calculateDaysLeft(stock.expiry_date),
        }));

        setData(dataWithCalcs);
      } catch (err) {
        console.error("Error fetching available stock data:", err);
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [fromDate, toDate, selectedInstitutions, locations]);

  const calculateDaysLeft = expiryDate => {
    if (!expiryDate) return null;
    const today = moment().startOf('day');
    const expiry = moment(expiryDate).startOf('day');
    return expiry.diff(today, 'days');
  };

  const calculateDaysSince = purchaseDate => {
    if (!purchaseDate) return null;
    const today = moment().startOf('day');
    const purchase = moment(purchaseDate).startOf('day');
    return today.diff(purchase, 'days');
  };

  const formatNumber = (number) => {
    if (number === null || number === undefined || Number.isNaN(Number(number)))
      return '-';
    return Number(number).toFixed(0);
  };

  const formatCurrency = (val) => {
    const num = Number(val) || 0;
    return num.toFixed(2);
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

  // Unique categories for filters
  const uniqueCategories = [...new Set(data.map(row => row.category).filter(Boolean))].sort((a, b) => a.localeCompare(b));

  // Filtering
  const filteredData = data.filter(row => {
    return (
      (selectedCategories.length > 0 ? selectedCategories.includes(row.category) : true)
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

    return (a.itemName || '').localeCompare(b.itemName || '');
  });

  // Group data by location
  const groupedData = sortedFilteredData.reduce((acc, row) => {
    const key = row.location_name || 'Unknown';
    if (!acc[key]) acc[key] = [];
    acc[key].push(row);
    return acc;
  }, {});

  // Calculate grand total
  const grandTotalQuantity = sortedFilteredData.reduce(
    (sum, row) => sum + (Number(row.quantity) || 0),
    0
  );

  const grandTotalAmount = sortedFilteredData.reduce(
    (sum, row) => sum + (Number(row.total) || 0),
    0
  );

  // Determine institution name:
  const locationnameKey = localStorage.getItem('locationname') || '';
  const institutionName = selectedInstitutionDisplay || (institutionMap[locationnameKey] || locationnameKey);

  return (
    <Container ref={ref} className="print-container">
      <PrintHeader>
        <img src={Logo} alt="Logo" />
        <h1>INVENTORY MANAGEMENT SYSTEM</h1>
      </PrintHeader>

      <div style={{ textAlign: 'center', marginBottom: 8 }}>
        <h1 style={{ margin: 0,fontSize:22 }}>Available Stock Report</h1>
      </div>

      <MetaInfo>
        <div>
          <span className="meta-label">Institution</span>
          <span className="meta-value" title={selectedInstitutionDisplay}>{selectedInstitutionDisplay}</span>
        </div>
        <div>
          <span className="meta-label">Report Date</span>
          <span className="meta-value">{formatDate(new Date().toISOString())}</span>
        </div>
        <div>
          <span className="meta-label">Category</span>
          <span className="meta-value" title={selectedCategoryDisplay}>{selectedCategoryDisplay}</span>
        </div>
      </MetaInfo>

      <DateRange>
        <h2 style={{ visibility: 'hidden' }}>From: {formatDate(fromDate)}</h2>
        <h2 style={{ visibility: 'hidden' }}>To: {formatDate(toDate)}</h2>
      </DateRange>

      <FilterContainer>
        <div ref={institutionMenuRef} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <label style={{ margin: 0 }}>Institution: </label>
          <InstitutionDropdown>
            <InstitutionToggle
              type="button"
              onClick={() => setInstitutionMenuOpen(prev => !prev)}
              title={selectedInstitutionDisplay}
            >
              <CategoryText>{selectedInstitutionDisplay}</CategoryText>
              <span>{institutionMenuOpen ? '▴' : '▾'}</span>
            </InstitutionToggle>
            {institutionMenuOpen && (
              <CategoryMenu>
                {locations.map((loc) => (
                  <CategoryOption key={loc.location_id}>
                    <input
                      type="checkbox"
                      checked={selectedInstitutions.includes(String(loc.location_id))}
                      onChange={() => {
                        const locId = String(loc.location_id);
                        setSelectedInstitutions(prev =>
                          prev.includes(locId)
                            ? prev.filter(id => id !== locId)
                            : [...prev, locId]
                        );
                      }}
                    />
                    <span>{loc.location_name}</span>
                  </CategoryOption>
                ))}
                <CategoryFooter>
                  <span>{selectedInstitutions.length === 0 ? 'Showing all institutions' : `${selectedInstitutions.length} selected`}</span>
                  {selectedInstitutions.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedInstitutions([])}
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
          </InstitutionDropdown>
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
      </FilterContainer>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 20 }}>Loading...</div>
      ) : (
        <>
          {/* LOCATION WISE TABLES */}
          {(
            selectedInstitutions.length === 0
              ? locations.map(loc => loc.location_name)
              : selectedInstitutions
                  .map(id =>
                    locations.find(l => String(l.location_id) === String(id))?.location_name
                  )
                  .filter(Boolean)
          ).map((locationName, groupIndex) => {
            const rows = (groupedData[locationName] || []).sort((a, b) => {
              const categoryCompare = (a.category || '').localeCompare(b.category || '');
              if (categoryCompare !== 0) return categoryCompare;

              return (a.itemName || '').localeCompare(b.itemName || '');
            });

            const locationTotalQuantity = rows.reduce(
              (sum, row) => sum + (Number(row.quantity) || 0),
              0
            );

            const locationTotalAmount = rows.reduce(
              (sum, row) => sum + (Number(row.total) || 0),
              0
            );

            return (
              <div key={groupIndex} style={{ marginBottom: 40 }}>
                {/* Location Heading */}
                <h3 style={{ marginTop: 25 }}>
                  Institution: {locationName}
                </h3>

                <TableHeader>
                  <thead>
                    <tr>
                      <th className="sno">S.No</th>
                      <th className="item">Item Name</th>
                      <th>Sub Category</th>
                      <th>Category</th>
                      <th>Quantity</th>
                      <th className="price">Price</th>
                      <th className="total">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.length > 0 ? (
                      <>
                        {rows.map((item, index) => (
                          <tr key={index}>
                            <td className="sno">{index + 1}</td>
                            <td className="item">{item.itemName || '-'}</td>
                            <td>{item.subCategory || '-'}</td>
                            <td>{item.category || '-'}</td>
                            <td>
                              {formatNumber(item.quantity) +
                                (item.unit ? ` ${item.unit}` : '')}
                            </td>
                            <td className="price">{formatCurrency(item.price)}</td>
                            <td className="total">{formatCurrency(item.total)}</td>
                          </tr>
                        ))}
                      </>
                    ) : (
                      <tr>
                        <td colSpan="7" style={{ textAlign: 'center' }}>
                          No data available for {locationName}
                        </td>
                      </tr>
                    )}
                    <tr>
                      <td
                        colSpan="4"
                        style={{
                          textAlign: 'right',
                          fontWeight: 'bold',
                          background: '#f5f5f5'
                        }}
                      >
                        Total for {locationName}
                      </td>

                      <td
                        style={{
                          fontWeight: 'bold',
                          background: '#f5f5f5'
                        }}
                      >
                        {formatNumber(locationTotalQuantity)}
                      </td>

                      <td></td>

                      <td
                        style={{
                          fontWeight: 'bold',
                          background: '#f5f5f5'
                        }}
                      >
                        {formatCurrency(locationTotalAmount)}
                      </td>
                    </tr>
                  </tbody>
                </TableHeader>
              </div>
            );
          })}

          {/* Summary */}
          {Object.keys(groupedData).length > 0 && (
            <div style={{ marginTop: 30, padding: '20px', backgroundColor: '#f0f8ff', borderRadius: '8px' }}>
              <h3 style={{ margin: '0 0 15px 0', textAlign: 'center', color: '#164863' }}>
                Summary
              </h3>
              <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                  <strong>Total Quantity Present:</strong>
                  <div style={{ fontSize: '18px', color: '#164863' }}>{formatNumber(grandTotalQuantity)}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <strong>Total Amount:</strong>
                  <div style={{ fontSize: '18px', color: '#164863' }}>{formatCurrency(grandTotalAmount)}</div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      <Footer>
        <p>Generated on {formatDate(new Date().toISOString())}</p>
      </Footer>
    </Container>
  );
});

export default AvailableStock;