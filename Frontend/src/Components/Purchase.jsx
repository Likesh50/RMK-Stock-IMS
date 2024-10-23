import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import dayjs from 'dayjs';
import { DemoContainer } from '@mui/x-date-pickers/internals/demo';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
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
    width:114px;
  }

  td input:focus {
    outline: 2px solid #164863;
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

  .category{
    min-width:115px;
    max-width:115px;
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
const Purchase = () => {
  const [rows, setRows] = useState([{ id: Date.now(), sno: 1, item: '', category: '', quantity: '', manufacturingDate: null, amount: '', expiry: '', invoice: '', address: '' }]);
  const numRecordsRef = useRef(null);
  const [date, setDate] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        console.log("Fetching items...");
        const response = await axios.get(`${import.meta.env.VITE_RMK_MESS_URL}/purchase/getItems`);
        console.log("Items fetched:", response.data);
        setItems(response.data);
      } catch (error) {
        console.error("Error fetching items:", error);
      }
    };
    fetchItems();
  }, []);

  const fetchCategoryForItem = (itemName) => {
    const item = items.find(i => i.item_name === itemName);
    return item ? item.category : '';
  };
  const handleDeleteRow = (id) => {
    setRows(prevRows => prevRows.filter(row => row.id !== id));
  };
  
  const handleAddRows = () => {
    const numberOfRows = parseInt(numRecordsRef.current.value, 10);
    if (numberOfRows > 0) {
      const lastSno = rows.length > 0 ? rows[rows.length - 1].sno : 0;
      const newRows = Array.from({ length: numberOfRows }, (_, index) => ({
        id: Date.now() + index,
        sno: lastSno + index + 1,
        item: '',
        category: '',
        quantity: '',
        manufacturingDate: null,
        amount: '',
        expiry: '',
        invoice: '',
        address: ''
      }));
      setRows(prevRows => [...prevRows, ...newRows]);
      numRecordsRef.current.value = '';
    }
  };

  const handleInputChange = (id, field, value) => {
    if (field === 'item') {
      const category = fetchCategoryForItem(value);
      setRows(prevRows =>
        prevRows.map(row =>
          row.id === id ? { ...row, [field]: value, category } : row
        )
      );
    }
    else if(field==='manufacturingDate')
      {
        setRows(prevRows =>
          prevRows.map(row =>
            row.id === id ? { ...row, [field]: value} : row
          )
        );
      } 
      else {
      setRows(prevRows =>
        prevRows.map(row =>
          row.id === id ? { ...row, [field]: value } : row
        )
      );
    }
  };

  const handleAddOneRow = () => {
    const lastSno = rows.length > 0 ? rows[rows.length - 1].sno : 0;
    setRows(prevRows => [
      ...prevRows,
      { id: Date.now(), sno: lastSno + 1, item: '', category: '', quantity: '', manufacturingDate: null, amount: '', expiry: '', invoice: '', address: '' }
    ]);
  };

  function addMonthsToDate(dateString, months) {
    let date = new Date(dateString);
  
    date.setMonth(date.getMonth() + months);
  
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); 
    const day = String(date.getDate()).padStart(2, '0');
  
    return `${year}-${month}-${day}`;
  }


  const handleSubmit = async () => {
    if (!date) {
      toast.error("Please enter the date.");
      return;
    }

  
    const invalidRows = rows.filter(row => !row.item || !row.quantity || !row.amount|| !row.address || !row.invoice|| !row.expiry || !row.manufacturingDate);
  
    if (invalidRows.length > 0) {
      toast.error("Please fill in all the fields for each row.");
      return;
    }
  
    const formattedDate = date.format('YYYY-MM-DD');
    const updatedRows = rows.map(row => ({
      ...row,
      manufacturingDate: row.manufacturingDate ? row.manufacturingDate.format('YYYY-MM-DD') : null,
    }));
 
  
    try {
      setLoading(true);
      console.log("Submitting data...", { date: formattedDate, arr: updatedRows });
      const response = await axios.post(`${import.meta.env.VITE_RMK_MESS_URL}/purchase/add`, {
        date: formattedDate,
        arr: updatedRows
      });
      console.log("Response from server:", response.data);
      toast.success("Items added successfully");
  
      setRows([{ id: Date.now(), sno: 1, item: '', category: '', quantity: '', manufacturingDate: null, amount: '', expiry: '', invoice: '', address: '' }]);
      setDate(null);
      numRecordsRef.current.value = '';
  
    } catch (error) {
      console.error("Error submitting data:", error);
      toast.error("Error submitting data");
    }
    finally {
      setLoading(false);  
    }
  };
  

  return (
    <Container>
      <h1>PURCHASE</h1>
      <FormContainer>
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

        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <DemoContainer components={['DatePicker']}>
            <DatePicker label="" className="date-picker" shouldDisableDate={(date) => date.isAfter(dayjs())} onChange={(newDate) => setDate(newDate)}
              value={date}
              format="YYYY-MM-DD" />
          </DemoContainer>
        </LocalizationProvider>
        <Records>
          <InputNumber
            type='number'
            id='num-records'
            placeholder='No of rows to be added'
            ref={numRecordsRef}
          />
        </Records>
        <AddButton onClick={handleAddRows}>Add</AddButton>
      </FormContainer>
      <ItemTable>
        <thead>
          <tr>
            <th>SNo</th>
            <th>Item</th>
            <th>Category</th>
            <th>Quantity</th>
            <th>Manufacture</th>
            <th>Use Before</th>
            <th>Invoice</th>
            <th>Rate</th>
            <th>Shop Address</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={row.id}>
              <td className="sno">{row.sno}</td>
              <td>
                <select
                  value={row.item}
                  className="item-select"
                  onChange={(e) => handleInputChange(row.id, 'item', e.target.value)}
                >
                  <option value="">Select item</option>
                  {items.map((item) => (
                    <option key={item.item_name} value={item.item_name}>{item.item_name}</option>
                  ))}
                </select>
              </td>
              <td className='category'>{row.category}</td>
              <td>
                <input
                  type="number"
                  value={row.quantity}
                  onChange={(e) => handleInputChange(row.id, 'quantity', e.target.value)}
                  required
                />
              </td>
              <td>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DemoContainer components={['DatePicker']}>
                  <DatePicker label="" className="date-picker" onChange={(newDate) => handleInputChange(row.id, 'manufacturingDate', newDate)}
                    value={row.manufacturingDate}
                    format="YYYY-MM-DD"
                    sx={{
                      width: '100%',
                      maxWidth: '300px',
                      backgroundColor: '#f5f5f5',
                      padding: '0px 0px 10px 0px',
                    }} />
                </DemoContainer>
              </LocalizationProvider>
              </td>
              <td>
                <input
                  type="number"
                  value={row.expiry}
                  onChange={(e) => handleInputChange(row.id, 'expiry', e.target.value)
                  }
                  required
                />
              </td>
              <td>
                <input
                  type="number"
                  value={row.invoice}
                  onChange={(e) => handleInputChange(row.id, 'invoice', e.target.value)
                  }
                  required
                />
              </td>
              <td>
                <input
                  type="number"
                  value={row.amount}
                  onChange={(e) => handleInputChange(row.id, 'amount', e.target.value)
                  }
                  required
                />
              </td>
              <td>
                <input
                  type="text"
                  value={row.address}
                  onChange={(e) => handleInputChange(row.id, 'address', e.target.value)
                  }
                  required
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
        <button className="add-button" onClick={handleAddOneRow}>Add One Row</button>
        <SubmitButton onClick={handleSubmit} disabled={loading} >Submit</SubmitButton>
      </SubmitContainer>
      <ToastContainer />
    </Container>
  );
};

export default Purchase;
