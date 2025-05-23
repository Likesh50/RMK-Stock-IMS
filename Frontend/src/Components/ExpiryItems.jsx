import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import Axios from 'axios';
import moment from 'moment';
const Container = styled.div`
  h1 {
    color: #164863;
    text-align: center;
  }
`;

const SearchContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 20px 0;

  .search-input {
    padding: 10px;
    border: 1px solid #164863;
    border-radius: 4px;
    font-size: 16px;
    width: 300px;
    box-sizing: border-box;
    margin-right: 10px;
    outline: none;
    transition: border-color 0.3s, box-shadow 0.3s;
    background-color: #f4f4f4;

    &::placeholder {
      color: #888;
    }

    &:focus {
      border-color: #4caf50;
      box-shadow: 0 0 8px rgba(76, 175, 80, 0.3);
    }
  }

  .search-button {
    padding: 10px 20px;
    border: none;
    border-radius: 4px;
    background-color: #4caf50;
    color: white;
    font-size: 16px;
    cursor: pointer;
    transition: background-color 0.3s, transform 0.2s;

    &:hover {
      background-color: #45a049;
    }

    &:active {
      transform: scale(0.98);
    }
  }
`;

const TableHeader = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 30px;
  font-family: Arial, sans-serif;

  th {
    background-color: #164863;
    color: white;
    font-size: 16px;
    font-weight: bold;
    padding: 10px;
    border: 1px solid #ddd;
    text-align: center;
    width: 200px;
  }

  td {
    padding: 10px;
    border: 1px solid #ddd;
    text-align: center;
    font-size: 16px;
  }

  tbody tr:nth-child(even) {
    background-color: #f4f4f4;
  }
`;

function ExpiryItems() {
  const [curr, setCurr] = useState([]);
  const [filteredCurr, setFilteredCurr] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [days, setDays] = useState(30); // Default to 30 days

  useEffect(() => {
    fetchExpiryItems();
  }, []);
  
  const fetchExpiryItems = () => {
    Axios.get(`${import.meta.env.VITE_RMK_MESS_URL}/expiry/expiry-items`, {
      params: { days } // Send the number of days as a query parameter
    })
      .then(res => {
        const data = res.data.map(stock => ({
          ...stock,
          daysLeftToExpire: calculateDaysLeft(stock.expiryDate),
          daysSincePurchase: calculateDaysSince(stock.manufacturingDate),
        }));
        setCurr(data); 
        setFilteredCurr(data);
        console.log(data);
      })
      .catch(err => console.error("Error fetching expiry items:", err));
  };
  

  const calculateDaysLeft = (expiryDate) => {
    const today = moment();
    const expiry = moment(expiryDate);
    return expiry.diff(today, 'days');
  };

  const calculateDaysSince = (purchaseDate) => {
    const today = moment();
    const purchase = moment(purchaseDate);
    return today.diff(purchase, 'days');
  };

  const handleSearch = (e) => {
    const searchValue = e.target.value;
    setSearchTerm(searchValue);
    const filteredData = curr.filter(item =>
      item.itemName.toLowerCase().includes(searchValue.toLowerCase()) || item.category.toLowerCase().includes(searchValue.toLowerCase())
    );
    
    setFilteredCurr(filteredData);
  };

  const formatNumber = (number) => {
    return Number(number).toFixed(2);
  };

  return (
    <Container>
      <h1>EXPIRING ITEMS</h1>
      <SearchContainer>
        <input
          type="text"
          className="search-input"
          placeholder="Enter item name / Category name"
          value={searchTerm}
          onChange={handleSearch} 
        />
        <input
          type="number"
          className="search-input"
          placeholder="Days"
          value={days}
          onChange={e => setDays(e.target.value)}  // Update the number of days
        />
        <button className="search-button" onClick={() => fetchExpiryItems()}>Search</button>
      </SearchContainer>

      <TableHeader>
        <thead>
          <tr>
            <th>ITEM</th>
            <th>CATEGORY</th>
            <th>QUANTITY</th>
            
            <th>DAYS SINCE PURCHASE</th>
            <th>DAYS LEFT TO EXPIRE</th>
            <th>EXPIRY DATE</th>
            
          </tr>
        </thead>
        <tbody>
        {filteredCurr.length > 0 ? filteredCurr.map((item, index) => (
            <tr key={index}>
            <td>{item.itemName}</td>
            <td>{item.category}</td>
            <td>{formatNumber(item.quantity)+" "+item.unit}</td>
            
            <td>{item.daysSincePurchase}</td>
            <td>{item.daysLeftToExpire >= 0 ? item.daysLeftToExpire : 'Expired'}</td>
            <td>{moment(item.expiryDate).format('DD-MM-YYYY')}</td>
            
            </tr>
        )) : (
            <tr>
            <td colSpan="6">No data available</td>
            </tr>
        )}
        </tbody>

      </TableHeader>
    </Container>
  );
}

export default ExpiryItems;