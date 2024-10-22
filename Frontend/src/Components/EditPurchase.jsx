import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import Axios from 'axios';
import moment from 'moment';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css'; // Import toastify CSS


const Container = styled.div`
  h1 {
    color: #164863;
    text-align: center;
  }
`;

const DatePickerContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 20px 0;

  .date-input {
    padding: 10px;
    border: 1px solid #164863;
    border-radius: 4px;
    font-size: 16px;
    margin-right: 10px;
    outline: none;
  }

  .fetch-button {
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
  }

  td {
    padding: 10px;
    border: 1px solid #ddd;
    text-align: center;
    font-size: 16px;

    input {
      width: 80%;
      padding: 5px;
      border: 1px solid #ccc;
      border-radius: 4px;
      outline: none;
    }
  }

  tbody tr:nth-child(even) {
    background-color: #f4f4f4;
  }
`;

const UpdateButton = styled.button`
  padding: 10px 15px;
  border: none;
  border-radius: 4px;
  background-color: #007bff;
  color: white;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.3s, transform 0.2s;

  &:hover {
    background-color: #0056b3;
  }

  &:active {
    transform: scale(0.98);
  }
`;

function EditPurchase() {
  const [date, setDate] = useState('');
  const [purchases, setPurchases] = useState([]);

  const fetchPurchases = async () => {
    try {
      const response = await Axios.get(`${import.meta.env.VITE_RMK_MESS_URL}/purchase/getPurchases/${date}`);
      setPurchases(response.data);
    } catch (error) {
      toast.error('Failed to fetch purchases. Please try again.');
    }
  };

  const handleUpdate = async (purchase) => {
    try {
      const response = await Axios.post(`${import.meta.env.VITE_RMK_MESS_URL}/purchase/updatePurchase`, purchase);
      toast.success('Purchase updated successfully!'); // Show success toast
      fetchPurchases(); // Refresh the purchase list
    } catch (error) {
      console.error('Error updating purchase:', error);
    }
  };

  const handleChange = (index, field, value) => {
    const updatedPurchases = [...purchases];
    updatedPurchases[index][field] = value; // Update the specific field in the purchase object
    setPurchases(updatedPurchases); // Update state with modified purchases
  };

  return (
    <Container>
      <h1>PURCHASE RECORDS</h1>
      <DatePickerContainer>
        <input
          type="date"
          className="date-input"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        <button className="fetch-button" onClick={fetchPurchases}>
          Fetch Purchases
        </button>
      </DatePickerContainer>
      <TableHeader>
        <thead>
          <tr>
            <th>ITEM</th>
            <th>QUANTITY</th>
            <th>INVOICE NO</th>
            <th>AMOUNT</th>
            <th>SHOP ADDRESS</th>
            <th>MANUFACTURING DATE</th>
            <th>EXPIRY DATE</th>
            <th>ACTIONS</th>
          </tr>
        </thead>
        <tbody>
          {purchases.length > 0 ? purchases.map((purchase, index) => (
            <tr key={purchase.purchase_id}>
              <td>{purchase.item_name}</td>
              <td>
                <input
                  type="number"
                  value={purchase.quantity}
                  onChange={(e) => handleChange(index, 'quantity', e.target.value)} // Use handleChange to update quantity
                />
              </td>
              <td>
                <input
                  type="text"
                  value={purchase.invoice_no}
                  onChange={(e) => handleChange(index, 'invoice_no', e.target.value)} // Use handleChange to update invoice no
                />
              </td>
              <td>
                <input
                  type="number"
                  value={purchase.amount}
                  onChange={(e) => handleChange(index, 'amount', e.target.value)} // Use handleChange to update amount
                />
              </td>
              <td>
                <input
                  type="text"
                  value={purchase.shop_address}
                  onChange={(e) => handleChange(index, 'shop_address', e.target.value)} // Use handleChange to update shop address
                />
              </td>
              <td>{moment(purchase.manufacturing_date).format('YYYY-MM-DD')}</td>
              <td>{moment(purchase.expiry_date).format('YYYY-MM-DD')}</td>
              <td>
                <UpdateButton onClick={() => handleUpdate(purchase)}>Update</UpdateButton>
              </td>
            </tr>
          )) : (
            <tr>
              <td colSpan="8">No data available</td>
            </tr>
          )}
        </tbody>
      </TableHeader>
      <ToastContainer />
    </Container>
  );
}

export default EditPurchase;
