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
  import { Autocomplete, TextField } from '@mui/material';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button
} from '@mui/material';
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
    background-color: #3582ab;;
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
      background-color: #3582ab;;
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
      background-color: #3582ab;;
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
    const [rows, setRows] = useState([
      {
        id: 1,
        sno: 1,
        item_id: null,
        item_name: '',
        itemOptions: [],
        quantity: '',
        amount: '',
        invoice: '',
        shop: null
        // add other fields as needed
      }
    ]);
    const numRecordsRef = useRef(null);
    const [date, setDate] = useState(null);
    const [loading, setLoading] = useState(false);
    const [subcategories, setSubcategories] = useState([]);
    const [shopAddresses, setShopAddresses] = useState([]);
    const [selectedId, setSelectedId] = useState(() => {
      return localStorage.getItem('locationid') || '';
    });
    const [locations, setLocations] = useState([]);
    const [invoice, setInvoice] = useState('');
    const [shop, setShop] = useState(null);
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
    const selectedLocationName = locations.find(loc => loc.location_id == selectedId)?.location_name || '';

    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [submitData, setSubmitData] = useState(null); // temp store data before actual submission

    // useEffect(() => {
      //   const fetchItems = async () => {
    //     try {
    //       console.log("Fetching items...");
    //       const response = await axios.get(`${import.meta.env.VITE_RMK_MESS_URL}/purchase/getItems`);
    //       console.log("Items fetched:", response.data);
    //       setItems(response.data);
    //     } catch (error) {
    //       console.error("Error fetching items:", error);
    //     }
    //   };
    //   fetchItems();
    // }, []);

 const handleValidateAndConfirm = () => {
    if (!date) {
      toast.error("Please enter the date.");
      return;
    }
    if (!invoice) {
      toast.error("Please enter the invoice.");
      return;
    }
    if (!shop) {
      toast.error("Please select the shop.");
      return;
    }

    const invalidRows = rows.filter(row =>
      !row.item_id || !row.quantity || !row.amount
    );

    if (invalidRows.length > 0) {
      toast.error("Please fill in all the fields for each row.");
      return;
    }

    const formattedDate = date.format('YYYY-MM-DD');
    const locationId = parseInt(localStorage.getItem('locationid'), 10);

    const updatedRows = rows.map(row => ({
      item_id: row.item_id,
      quantity: row.quantity,
      amount: row.amount,
      invoice: invoice,
      shop_id: shop.value
    }));

    setSubmitData({ date: formattedDate, rows: updatedRows, location: locationId });
    confirmSubmit();
  };

const confirmSubmit = async () => {
  if (!submitData) return;

  try {
    setLoading(true);
    const response = await axios.post(`${import.meta.env.VITE_RMK_MESS_URL}/purchase/add`, {
      date: submitData.date,
      arr: submitData.rows,
      location: submitData.location
    });

    toast.success("Items added successfully");

    // Reset
    setRows([
      {
        id: Date.now(),
        sno: 1,
        item_id: null,
        item_name: '',
        itemOptions: [],
        quantity: '',
        amount: '',
        invoice: '',
        shop: null
      }
    ]);
    setDate(null);
    numRecordsRef.current.value = '';
    setSubmitData(null);
    setShowConfirmDialog(false);

  } catch (error) {
    console.error("Error submitting data:", error);
    toast.error("Error submitting data");
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
  setShowConfirmDialog(true);
}, []);

  useEffect(() => {
    const fetchSubcategories = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_RMK_MESS_URL}/purchase/subcategories`);
        // remove duplicates & empty:
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
  const fetchShops = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_RMK_MESS_URL}/shops/`);
      const shops = response.data.map(shop => ({
        label: shop.name,
        value: shop.id
      }));
      setShopAddresses(shops);
    } catch (error) {
      console.error("Error fetching shop addresses:", error);
    }
  };
  fetchShops();
}, []);



    const handleDeleteRow = (id) => {
      setRows(prevRows => prevRows.filter(row => row.id !== id));
    };
    const fetchItemsBySubcategory = async (subcategory, rowId) => {
  try {
    const response = await axios.get(`${import.meta.env.VITE_RMK_MESS_URL}/purchase/getItemsBySubcategory`, {
          params: { subcategory }
        });
    const options = response.data.map(item => ({
      label: item.item_name,
      value: item.item_id
    }));
    setRows(prevRows =>
      prevRows.map(row =>
        row.id === rowId ? { ...row, itemOptions: options } : row
      )
    );
  } catch (error) {
    console.error("Failed to fetch items", error);
  }
};

    const handleAddRows = () => {
      const numberOfRows = parseInt(numRecordsRef.current.value, 10);
      if (numberOfRows > 0) {
        const lastSno = rows.length > 0 ? rows[rows.length - 1].sno : 0;
        const newRows = Array.from({ length: numberOfRows }, (_, index) => ({
            id: Date.now() + index,
            sno: lastSno + index + 1,
            item_id: null,
            item_name: '',
            itemOptions: [],
            quantity: '',
            amount: '',
            invoice: '',
            shop: null
          }));

        setRows(prevRows => [...prevRows, ...newRows]);
        numRecordsRef.current.value = '';
      }
    };

    const handleInputChange = (rowId, field, value) => {
  setRows(prevRows =>
    prevRows.map(row =>
      row.id === rowId ? { ...row, [field]: value } : row
    )
  );

  if (field === 'category') {
    fetchItemsBySubcategory(value, rowId);
  }
};


    const handleAddOneRow = () => {
      const lastSno = rows.length > 0 ? rows[rows.length - 1].sno : 0;
      setRows(prevRows => [
        ...prevRows,
        {
          id: Date.now(),
          sno: lastSno + 1,
          item_id: null,
          item_name: '',
          itemOptions: [],
          quantity: '',
          amount: '',
          invoice: '',
          shop: null
        }
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
            <DatePicker
              label=""
              className="date-picker"
              shouldDisableDate={(date) => date.isAfter(dayjs())}
              onChange={(newDate) => setDate(newDate)}
              value={date}
              format="YYYY-MM-DD"
            />
          </DemoContainer>
        </LocalizationProvider>

        <TextField
          label="Invoice"
          variant="outlined"
          size="small"
          value={invoice}
          onChange={(e) => setInvoice(e.target.value)}
          sx={{ width: 180, marginLeft: 2 }}
        />

        <Autocomplete
          options={shopAddresses}
          getOptionLabel={(option) => option?.label || ''}
          value={shop}
          onChange={(_, newValue) => setShop(newValue)}
          renderInput={(params) => (
            <TextField {...params} label="Shop Name" variant="outlined" size="small" />
          )}
          sx={{ width: 180, marginLeft: 2 }}
        />

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
            <th>Category</th>
            <th>Item</th>
            <th>Quantity</th>
            {/* <th>Manufacture</th>
            <th>Use Before</th> */}
            <th>Rate</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={row.id}>
              <td className="sno">{row.sno}</td>

              <td>
                <Autocomplete
                  freeSolo
                  options={subcategories}
                  value={row.category}
                  onChange={(e, newValue) =>
                    handleInputChange(row.id, 'category', newValue || '')
                  }
                  onInputChange={(e, newInputValue) =>
                    handleInputChange(row.id, 'category', newInputValue)
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Subcategory"
                      variant="outlined"
                      size="small"
                    />
                  )}
                  sx={{ width: 150 }}
                />
              </td>

              <td>
                <Autocomplete
                  options={row.itemOptions}
                  getOptionLabel={(option) => option.label}
                  isOptionEqualToValue={(opt, val) => opt.value === val.value}
                  value={
                    row.item_id != null
                      ? { label: row.item_name, value: row.item_id }
                      : null
                  }
                  onChange={(_, selected) => {
                    if (selected) {
                      handleInputChange(row.id, 'item_id', selected.value);
                      handleInputChange(row.id, 'item_name', selected.label);
                    } else {
                      handleInputChange(row.id, 'item_id', null);
                      handleInputChange(row.id, 'item_name', '');
                    }
                  }}
                  renderInput={(params) => (
                    <TextField {...params} label="Item" variant="outlined" size="small" />
                  )}
                  sx={{ width: 180 }}
                />
              </td>

              <td>
                <input
                  type="number"
                  value={row.quantity}
                  onChange={(e) => handleInputChange(row.id, 'quantity', e.target.value)}
                  required
                />
              </td>

              <td>
                <input
                  type="number"
                  value={row.amount}
                  onChange={(e) => handleInputChange(row.id, 'amount', e.target.value)}
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
        <SubmitButton onClick={handleValidateAndConfirm} disabled={loading}>Submit</SubmitButton>
      </SubmitContainer>

      <ToastContainer />

      <Dialog open={showConfirmDialog} onClose={() => setShowConfirmDialog(false)}>
        <DialogTitle>Confirm Purchase</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to start entering purchases for location
            <strong> {selectedLocationName} </strong>?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowConfirmDialog(false)} color="secondary">
            Cancel
          </Button>
          <Button onClick={() => {
            setDate(dayjs());  // set today's date automatically, optional
            setShowConfirmDialog(false);
          }}
            color="primary" variant="contained">
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
  };

  export default Purchase;
