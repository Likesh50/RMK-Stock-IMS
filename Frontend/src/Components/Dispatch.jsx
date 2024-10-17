import React, { useState, useRef, useEffect } from 'react';
import { DemoContainer } from '@mui/x-date-pickers/internals/demo';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import styled from 'styled-components';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import dayjs from 'dayjs';
import { HashLoader } from 'react-spinners'; 
const Container = styled.div`
  h1 {
    color: #164863;
    text-align: center;
  }
`;

const FormContainer = styled.div`
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
  margin-left: 450px;
`;

const Records = styled.div`
  display: flex;
  flex-direction: column;

  label {
    margin-left: 12px;
  }
`;

const InputNumber = styled.input`
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  background-color: #f4f4f4;
  margin-left: 10px;
  margin-top: 24px;
  width: 190px;
  font-size: 13px;
`;

const AddButton = styled.button`
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  background-color: #164863;
  color: white;
  cursor: pointer;
  font-size: 14px;
  margin-top: 24px;
  margin-left: 10px;

  &:hover {
    background-color: #0a3d62;
  }
`;

const ItemTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-family: Arial, sans-serif;
  table-layout: auto;

  th, td {
    border: 1px solid #ddd;
    padding: 12px;
    text-align: left;
    transition: background-color 0.3s, color 0.3s;
  }

  th {
    background-color: #164863;
    color: white;
    font-size: 16px;
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

  td input {
    border: 1px solid #ccc;
    border-radius: 4px;
    padding: 8px;
    font-size: 14px;
    width: 90%;
    box-sizing: border-box;
    transition: border-color 0.3s, box-shadow 0.3s;
    background-color: #fff;
  }

  td input:focus {
    border-color: #164863;
    outline: none;
    box-shadow: 0 0 5px rgba(22, 72, 99, 0.3);
  }

  td input::placeholder {
    color: #888;
  }

  td select {
    border: 1px solid #ccc;
    border-radius: 4px;
    padding: 8px;
    font-size: 14px;
    width: 180px;
  }

  .sno {
    min-width: 50px;
  }

  
`;

const SubmitContainer = styled.div`
  margin-top: 20px;
  text-align: center;

  .add-button {
    padding: 10px 20px;
    border: none;
    border-radius: 4px;
    background-color: #164863;
    color: white;
    font-size: 16px;
    cursor: pointer;
    transition: background-color 0.3s, transform 0.2s;
    margin-right: 10px;

    &:hover {
      background-color: #0a3d62;
    }

    &:active {
      transform: scale(0.98);
    }
  }
`;

const SubmitButton = styled.button`
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
`;
const DeleteButton = styled.button`
  background-color: #d9534f; /* Bootstrap danger color */
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 12px;
  cursor: pointer;
  transition: background-color 0.3s;

  &:hover {
    background-color: #c9302c; /* Darker shade on hover */
  }

  &:focus {
    outline: none;
  }

  &:disabled {
    background-color: #e7e7e7; /* Light gray for disabled */
    color: #a9a9a9; /* Darker gray for text */
    cursor: not-allowed;
  }
`;
function Dispatch() {
  const [rows, setRows] = useState([{ id: Date.now(), item: '', quantity: '', location: '', receiver: '', incharge: '', expiry: '' }]);
  const [items, setItems] = useState([]);
  const [expiryDates, setExpiryDates] = useState({});  // Now it's an object to hold expiry dates per row
  const [itemQuantities, setItemQuantities] = useState({}); // Same for item quantities per row
  const numRecordsRef = useRef(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_RMK_MESS_URL}/dispatch/items`);
        setItems(response.data);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    fetchData();
  }, []);

  const handleAddRows = () => {
    const numberOfRows = parseInt(numRecordsRef.current.value, 10);
    if (numberOfRows > 0) {
      const lastId = Date.now();
      const newRows = Array.from({ length: numberOfRows }, (_, index) => ({
        id: lastId + index,
        item: '',
        quantity: '',
        location: '',
        receiver: '',
        incharge: '',
        expiry: ''
      }));
      setRows(prevRows => [...prevRows, ...newRows]);
      numRecordsRef.current.value = '';
    }
  };

  const handleInputChange = async (id, field, value) => {
    if (field === 'item') {
        const selectedItem = items.find(item => item.item_id == value);
        if (selectedItem) {
            try {
                const expiryResponse = await axios.get(`${import.meta.env.VITE_RMK_MESS_URL}/dispatch/expiry/${selectedItem.item_id}`);
                const expiryData = expiryResponse.data.map(exp => ({ expiry_date: exp.expiry_date, purchase_id: exp.purchase_id }));

                setExpiryDates(prev => ({ ...prev, [id]: expiryData }));

                setRows(prevRows => prevRows.map(row => (
                    row.id === id ? { ...row, item: value } : row
                )));
            } catch (error) {
                console.error("Error fetching expiry dates:", error);
            }
        }
    } else if (field === 'expiry') {
        const selectedExpiry = expiryDates[id]?.find(exp => exp.expiry_date === value);
        const purchase_id = selectedExpiry ? selectedExpiry.purchase_id : null;

        if (purchase_id) {
            try {
                const stockResponse = await axios.get(`${import.meta.env.VITE_RMK_MESS_URL}/dispatch/retrieveStock/${rows.find(r => r.id === id).item}/${purchase_id}`);
                const stockData = stockResponse.data;

                setItemQuantities(prev => ({ ...prev, [id]: stockData.quantity }));

                setRows(prevRows => prevRows.map(row => (
                    row.id === id ? { ...row, expiry: value, purchase_id } : row
                )));
            } catch (error) {
                console.error("Error fetching stock data:", error);
            }
        }
    } else {
        setRows(prevRows => prevRows.map(row => (row.id === id ? { ...row, [field]: value } : row)));
    }
};


  const handleDeleteRow = (id) => {
    setRows(prevRows => prevRows.filter(row => row.id !== id));
  };

  const handleSubmit = async () => {
    const arr = rows.map(row => ({
      purchase_id: row.purchase_id,
      item_id: row.item,
      quantity: row.quantity,
      location: row.location,
      receiver: row.receiver,
      incharge: row.incharge,
      expiry: row.expiry,
      dispatch_date: selectedDate ? selectedDate.format('YYYY-MM-DD') : '', // Format the date
    }));

    try {
      setLoading(true);
      const response = await axios.post(`${import.meta.env.VITE_RMK_MESS_URL}/dispatch/createDispatch`, arr);
      toast.success("Items dispatched successfully");
      setRows([{ id: Date.now(), item: '', quantity: '', location: '', receiver: '', incharge: '', expiry: '' }]);
      setSelectedDate(null);
    } catch (error) {
      console.error("Error dispatching items:", error);
      toast.error("Error dispatching items. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      {loading && (
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
      )}
      <h1>DISPATCH</h1>
      <FormContainer>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <DatePicker label="Select date" value={selectedDate} onChange={setSelectedDate} />
        </LocalizationProvider>
        <Records>
          <InputNumber type='number' placeholder='No of rows to be added' ref={numRecordsRef} />
        </Records>
        <AddButton onClick={handleAddRows}>Add</AddButton>
      </FormContainer>
      <ItemTable>
        <thead>
          <tr>
            <th>SNo</th>
            <th>Select Item</th>
            <th>Expiry Date</th>
            <th>Available</th>
            <th>Quantity</th>
            <th>Location</th>
            <th>Receiver</th>
            <th>Incharge</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={row.id}>
              <td>{index + 1}</td>
              <td>
                <select value={row.item} onChange={(e) => handleInputChange(row.id, 'item', e.target.value)}>
                  <option value="">Select Item</option>
                  {items.map(item => (
                    <option key={item.item_id} value={item.item_id}>
                      {item.item_name}
                    </option>
                  ))}
                </select>
              </td>
              <td>
                <select value={row.expiry} onChange={(e) => handleInputChange(row.id, 'expiry', e.target.value)}>
                  <option value="">Select Expiry Date</option>
                  {expiryDates[row.id]?.map((exp, idx) => (
                    <option key={idx} value={exp.expiry_date}>
                      {dayjs(exp.expiry_date).format("YYYY-MM-DD")}
                    </option>
                  ))}
                </select>
              </td>
              <td>{itemQuantities[row.id] || "N/A"}</td>
              <td>
                <input
                  type="number"
                  value={row.quantity}
                  onChange={(e) => handleInputChange(row.id, 'quantity', e.target.value)}
                />
              </td>
              <td>
                <input
                  type="text"
                  value={row.location}
                  onChange={(e) => handleInputChange(row.id, 'location', e.target.value)}
                />
              </td>
              <td>
                <input
                  type="text"
                  value={row.receiver}
                  onChange={(e) => handleInputChange(row.id, 'receiver', e.target.value)}
                />
              </td>
              <td>
                <input
                  type="text"
                  value={row.incharge}
                  onChange={(e) => handleInputChange(row.id, 'incharge', e.target.value)}
                />
              </td>
              <td>
                <DeleteButton onClick={() => handleDeleteRow(row.id)}>Delete</DeleteButton>
              </td>
            </tr>
          ))}
        </tbody>
      </ItemTable>

      <SubmitContainer>
        <SubmitButton onClick={handleSubmit}>Submit Dispatch</SubmitButton>
      </SubmitContainer>
      <ToastContainer />
    </Container>
  );
}

export default Dispatch;
