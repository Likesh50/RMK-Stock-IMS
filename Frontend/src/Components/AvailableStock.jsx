import React, { useEffect, useState, forwardRef } from 'react';
import styled from 'styled-components';
import Axios from 'axios';
import moment from 'moment';

const Container = styled.div`
  h1 {
    color: #164863;
    text-align: center;
    margin: 8px 0 14px;
  }
`;

const MetaInfo = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 50px;
  margin: 10px 0 15px 0;
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
    font-size: 16px;
    color: #164863;
  }

  .meta-value {
    font-weight: 500;
    font-size: 16px;
  }

  @media print {
    justify-content: space-between;
    gap: 10px;
    .meta-label,
    .meta-value {
      font-size: 17px;
    }
  }
`;

const Controls = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin: 12px 0;
  flex-wrap: wrap;

  select,
  .search-input {
    padding: 8px 10px;
    border-radius: 4px;
    border: 1px solid #164863;
    font-size: 14px;
    background: #f4f4f4;
    outline: none;
  }

  .search-button {
    padding: 8px 12px;
    border-radius: 4px;
    border: none;
    background: #4caf50;
    color: #fff;
    cursor: pointer;
  }

  .clear-button {
    padding: 8px 12px;
    border-radius: 4px;
    border: none;
    background: #f44336;
    color: #fff;
    cursor: pointer;
  }

  @media print {
    display: none; /* hide filters in print */
  }
`;

const TableHeader = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 8px;
  font-family: Arial, sans-serif;

  th {
    background-color: #164863;
    color: white;
    font-size: 14px;
    font-weight: bold;
    padding: 8px;
    border: 1px solid #ddd;
    text-align: center;
  }

  td {
    padding: 8px;
    border: 1px solid #ddd;
    text-align: center;
    font-size: 14px;
  }

  tbody tr:nth-child(even) {
    background-color: #f4f4f4;
  }

  th.sno,
  td.sno {
    width: 60px;
    min-width: 50px;
  }

  th.item,
  td.item {
    text-align: left;
    padding-left: 12px;
  }

  @media print {
    th,
    td {
      padding: 6px;
      font-size: 12px;
    }
  }
`;

const institutionMap = {
  RMKEC: "R.M.K. Engineering College",
  RMD: "R.M.D. Engineering College",
  RMKCET: "R.M.K. College of Engg. & Technology",
  "RMK Residential school": "R.M.K. Residential School",
  "RMK Patashala": "R.M.K. Patashala"
};

const AvailableStock = forwardRef(({ fromDate, toDate }, ref) => {
  const [curr, setCurr] = useState([]);
  const [filteredCurr, setFilteredCurr] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [locations, setLocations] = useState([]);

  useEffect(() => {
    // Load session user locations to resolve institution name
    const stored = sessionStorage.getItem('userlocations');
    if (stored) {
      try {
        setLocations(JSON.parse(stored));
      } catch (err) {
        console.error('Invalid session userlocations JSON:', err);
      }
    }
  }, []);

  const selectedLocationId = localStorage.getItem('locationid') || '';
  const locationnameKey = localStorage.getItem('locationname') || '';
  const selectedLocationNameFromSession = locations.find(
    loc => String(loc.location_id) === String(selectedLocationId)
  )?.location_name || '';

  const institutionName =
    selectedLocationNameFromSession ||
    institutionMap[locationnameKey] ||
    locationnameKey;

  useEffect(() => {
    const locationId = parseInt(localStorage.getItem('locationid'), 10);
    if (!locationId) return;

    setLoading(true);
    Axios.get(`${import.meta.env.VITE_RMK_MESS_URL}/stocks/availablestock?location_id=${locationId}`)
      .then(res => {
        const apiData = res.data?.data || [];

        // Remove items with quantity ≤ 0
        const nonZero = apiData.filter(item => Number(item.quantity) > 0);

        const data = nonZero.map(stock => ({
          ...stock,
          daysSincePurchase: calculateDaysSince(stock.purchase_date),
          daysLeftToExpire: calculateDaysLeft(stock.expiry_date),
        }));

        // Get unique categories
        const uniqCats = Array.from(
          new Set(data.map(d => (d.category || '').trim()).filter(Boolean))
        ).sort((a, b) => a.localeCompare(b));

        setCurr(data);
        setFilteredCurr(data);
        setCategories(uniqCats);
      })
      .catch(err => {
        console.error('Error fetching stock data:', err);
        setCurr([]);
        setFilteredCurr([]);
        setCategories([]);
      })
      .finally(() => setLoading(false));
  }, []);

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

  useEffect(() => {
    const lower = (searchTerm || '').toLowerCase().trim();
    const filtered = curr.filter(item => {
      if (selectedCategory && item.category !== selectedCategory) return false;
      if (!lower) return true;
      return (
        (item.itemName && item.itemName.toLowerCase().includes(lower)) ||
        (item.subCategory && item.subCategory.toLowerCase().includes(lower))
      );
    });
    setFilteredCurr(filtered);
  }, [curr, searchTerm, selectedCategory]);

  const formatNumber = number => {
    if (number === null || number === undefined || Number.isNaN(Number(number)))
      return '-';
    return Number(number).toFixed(0);
  };

  return (
    <Container ref={ref}>
      <h1>AVAILABLE STOCK</h1>

      {/* Meta Info visible for print */}
      <MetaInfo>
        <div>
          <span className="meta-label">Institution</span>
          <span className="meta-value">{institutionName || '—'}</span>
        </div>
        <div>
          <span className="meta-label">Report Date</span>
          <span className="meta-value">
            {moment().format('DD-MM-YYYY')}
          </span>
        </div>
        
        <div>
          <span className="meta-label">Category</span>
          <span className="meta-value">{selectedCategory || 'All'}</span>
        </div>
      </MetaInfo>

      <Controls>
        <select
          value={selectedCategory}
          onChange={e => setSelectedCategory(e.target.value)}
        >
          <option value="">All Categories</option>
          {categories.map((cat, i) => (
            <option key={i} value={cat}>
              {cat}
            </option>
          ))}
        </select>

        <input
          type="text"
          className="search-input"
          placeholder="Search item or subcategory"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />

        <button className="search-button">Search</button>
        <button className="clear-button" onClick={() => {
          setSelectedCategory('');
          setSearchTerm('');
        }}>
          Clear
        </button>
      </Controls>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 20 }}>Loading...</div>
      ) : (
        <TableHeader>
          <thead>
            <tr>
              <th className="sno">S.No</th>
              <th className="item">ITEM</th>
              <th>SUB CATEGORY</th>
              {!selectedCategory && <th>CATEGORY</th>}
              <th>QUANTITY</th>
            </tr>
          </thead>
          <tbody>
            {filteredCurr.length > 0 ? (
              filteredCurr.map((item, index) => (
                <tr key={index}>
                  <td className="sno">{index + 1}</td>
                  <td className="item">{item.itemName || '-'}</td>
                  <td>{item.subCategory || '-'}</td>
                  {!selectedCategory && <td>{item.category || '-'}</td>}
                  <td>
                    {formatNumber(item.quantity) +
                      (item.unit ? ` ${item.unit}` : '')}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={selectedCategory ? 4 : 5}
                  style={{ textAlign: 'center' }}
                >
                  No data available
                </td>
              </tr>
            )}
          </tbody>
        </TableHeader>
      )}
    </Container>
  );
});

export default AvailableStock;
