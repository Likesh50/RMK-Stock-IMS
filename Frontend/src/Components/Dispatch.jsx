import React, { useState, useRef, useEffect } from 'react';
import { DemoContainer } from '@mui/x-date-pickers/internals/demo';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import styled from 'styled-components';
import axios from 'axios';
import { Autocomplete, TextField } from '@mui/material';
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
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button
} from '@mui/material';

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
  const [rows, setRows] = useState([{
    id: Date.now(),
    category: '',
    item: '',
    quantity: '',
    location: '',
    receiver: '',
    incharge: '',
  }]);
  const [itemsByRowId, setItemsByRowId] = useState({});

  const [availableStock, setAvailableStock] = useState({});
  const numRecordsRef = useRef(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [subcategories, setSubcategories] = useState([]);
  const [items, setItems] = useState([]);
  
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [locations, setLocations] = useState([]);
  const [selectedId, setSelectedId] = useState(() => {
    return localStorage.getItem('locationid') || '';
  });
  const [blocks, setBlocks] = useState([]);

useEffect(() => {
  if (selectedId) {
    axios.get(`${import.meta.env.VITE_RMK_MESS_URL}/blocks`, {
      params: { location_id: selectedId }
    })
    .then(res => setBlocks(res.data))
    .catch(err => console.error("Error fetching blocks:", err));
  }
}, [selectedId]);
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

  const selectedLocationName = locations.find(
    loc => loc.location_id == selectedId
  )?.location_name || '';

  useEffect(() => {
    const fetchSubcategories = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_RMK_MESS_URL}/purchase/subcategories`);
        const subs = Array.from(new Set(
          response.data
            .map(item => item.sub_category)
            .filter(s => s && s.trim() !== '')
        ));
        setSubcategories(subs);
      } catch (error) {
        console.error("Error fetching subcategories:", error);
      }
    };
    fetchSubcategories();
  }, []);

  useEffect(() => {
  setShowConfirmDialog(true);
}, []);


  const fetchItemsForSubcategory = async (subcategory, rowId) => {
  try {
    const response = await axios.get(`${import.meta.env.VITE_RMK_MESS_URL}/purchase/getItemsBySubcategory`, {
      params: { subcategory }
    });

    setItemsByRowId(prev => ({ ...prev, [rowId]: response.data }));
  } catch (error) {
    console.error("Error fetching items:", error);
  }
};


const fetchAvailableStock = async (rowId, itemId) => {
  try {
    const locationId = parseInt(window.localStorage.getItem('locationid'), 10);
    const response = await axios.get(
      `${import.meta.env.VITE_RMK_MESS_URL}/dispatch/stockAvailability/${itemId}/${locationId}`
    );

    setAvailableStock(prev => ({ ...prev, [rowId]: response.data || [] }));
  } catch (error) {
    console.error("Error fetching available stock:", error);
    toast.error("Failed to fetch available stock.");
    setAvailableStock(prev => ({ ...prev, [rowId]: [] }));
  }
};



  const handleAddRows = () => {
    const numberOfRows = parseInt(numRecordsRef.current.value, 10);
    if (numberOfRows > 0) {
      const lastId = Date.now();
      const newRows = Array.from({ length: numberOfRows }, (_, index) => ({
        id: lastId + index,
        category: '',
        item: '',
        quantity: '',
        location: '',
        receiver: '',
        incharge: '',
        selectedPurchaseId: '',
        availableForBatch: 0
      }));
      setRows(prevRows => [...prevRows, ...newRows]);
      numRecordsRef.current.value = '';
    }
  };

  const handleInputChange = async (id, field, value) => {
    if (field === 'category') {
  fetchItemsForSubcategory(value, id);
  setRows(prevRows => prevRows.map(row =>
    row.id === id ? {
      ...row, category: value, item: '', quantity: '', location: '', receiver: '', incharge: '', selectedPurchaseId: '', availableForBatch: 0
    } : row
  ));
  return;
}


    if (field === 'item') {
  console.log('Item selected:', id, value);

  setRows(prevRows => prevRows.map(row =>
    row.id === id ? {
      ...row, item: value, quantity: ''
    } : row
  ));

  // Fetch available stock after setting item
  if (value) {
    await fetchAvailableStock(id, value);
  }
  return;
}

    setRows(prevRows => 
      prevRows.map(row => (row.id === id ? { ...row, [field]: value } : row))
    );
  };

  const handleDeleteRow = (id) => {
    setRows(prevRows => prevRows.filter(row => row.id !== id));
  };

  const handleSubmit = async () => {
    const arr = rows.map(row => ({
      item_id: row.item,
      block_id: row.block_id,
      quantity: parseFloat(row.quantity),
      receiver: row.receiver,
      incharge: row.incharge,
      dispatch_date: selectedDate ? selectedDate.format('YYYY-MM-DD') : ''
    }));

    try {
      setLoading(true);
      const response = await axios.post(`${import.meta.env.VITE_RMK_MESS_URL}/dispatch/createDispatch`, {
        arr,
        location_id: parseInt(window.localStorage.getItem('locationid'), 10)
      });

      toast.success("Items dispatched successfully");
      setRows([{ id: Date.now(), category: '', item: '', quantity: '', location: '', receiver: '', incharge: '', selectedPurchaseId: '', availableForBatch: 0 }]);
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
          position: 'fixed', top: '0', left: '0', width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.7)'
        }}>
          <HashLoader color="#164863" loading={loading} size={90} />
        </div>
      )}
      <h1>DISPATCH</h1>
      <FormContainer>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <DatePicker label="Select date" value={selectedDate} onChange={setSelectedDate} shouldDisableDate={(date) => date.isAfter(dayjs())}/>
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
            <th>Subcategory</th>
            <th>Item</th>
            <th>Available</th>
            <th>Quantity</th>
            <th>Block</th>
            <th>Sticker No</th>
            <th>Incharge</th>
            <th>Receiver</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={row.id}>
              <td>{index + 1}</td>
              <td>
                <Autocomplete
                  options={subcategories}
                  value={row.category}
                  onChange={(e, newValue) => handleInputChange(row.id, 'category', newValue || '')}
                  renderInput={(params) => <TextField {...params} label="Subcategory" variant="outlined" size="small" />}
                  sx={{ width: 150 }}
                  freeSolo
                />
              </td>
              <td>
               <Autocomplete
                options={(itemsByRowId[row.id] || [])
                  .filter(i => !rows.some(r => r.id !== row.id && r.item === i.item_id))
                  .map(i => ({ label: i.item_name, id: i.item_id }))}
                value={
                  itemsByRowId[row.id]?.find(i => i.item_id === row.item)
                    ? {
                        label: itemsByRowId[row.id].find(i => i.item_id === row.item).item_name,
                        id: row.item
                      }
                    : null
                }
                onChange={(e, newValue) => handleInputChange(row.id, 'item', newValue ? newValue.id : '')}
                renderInput={(params) => <TextField {...params} label="Item" variant="outlined" size="small" />}
                sx={{ width: 180 }}
                disabled={!row.category}
              />


              </td>
              <td>
                {availableStock[row.id]?.[0]?.quantity ?? 'N/A'}
              </td>

             <td>
              <input
                type="number"
                value={row.quantity}
                onChange={(e) => handleInputChange(row.id, 'quantity', e.target.value)}
                min={0}
                disabled={availableStock[row.id]?.[0]?.quantity === undefined}
              />
            </td>
            <td>
            <Autocomplete
              options={blocks.map(b => ({ label: b.block_name, id: b.block_id }))}
              value={
                blocks.find(b => b.block_id === row.block_id)
                  ? { label: blocks.find(b => b.block_id === row.block_id).block_name, id: row.block_id }
                  : null
              }
              onChange={(e, newValue) => handleInputChange(row.id, 'block_id', newValue ? newValue.id : '')}
              renderInput={(params) => <TextField {...params} label="Block" variant="outlined" size="small" />}
              sx={{ width: 180 }}
            />
          </td>                       
          <td>
            <input
              type="text"
              value={row.sticker_no}
              onChange={(e) => handleInputChange(row.id, 'sticker_no', e.target.value)}
            />
          </td>  
            <td>
              <input
                type="text"
                value={row.incharge}
                onChange={(e) => handleInputChange(row.id, 'incharge', e.target.value)}
                disabled={availableStock[row.id]?.[0]?.quantity === undefined}
              />   
            </td>
            <td>
              <input
                type="text"
                value={row.receiver}
                onChange={(e) => handleInputChange(row.id, 'receiver', e.target.value)}
                disabled={availableStock[row.id]?.[0]?.quantity === undefined}
              />
            </td>
 
              <td><DeleteButton onClick={() => handleDeleteRow(row.id)}>Delete</DeleteButton></td>
            </tr>
          ))}
        </tbody>
      </ItemTable>
      <SubmitContainer>
        <SubmitButton onClick={handleSubmit}>Submit Dispatch</SubmitButton>
      </SubmitContainer>
      <ToastContainer />
      <Dialog open={showConfirmDialog} onClose={() => setShowConfirmDialog(false)}>
        <DialogTitle>Confirm Dispatch</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to start entering dispatches for location 
            <strong> {selectedLocationName} </strong>?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowConfirmDialog(false)} color="secondary">
            Cancel
          </Button>
          <Button
            onClick={() => {
              setSelectedDate(dayjs());  // auto-sets today's date like in purchase
              setShowConfirmDialog(false);
            }}
            color="primary"
            variant="contained"
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

    </Container>
  );
}



export default Dispatch;