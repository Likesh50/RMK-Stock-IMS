import React, { useState } from 'react';
import styled from 'styled-components';
import Axios from 'axios';
import moment from 'moment';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css'; // Import toastify CSS
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';

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
  gap:20px;
  margin: 20px 0;

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
    background-color: #3582ab;;
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

const DeleteButton = styled.button`
  padding: 10px 15px;
  border: none;
  border-radius: 4px;
  background-color: #ff4d4d;
  color: white;
  font-size: 16px;
  cursor: pointer;
  margin-left: 10px;
  transition: background-color 0.3s, transform 0.2s;

  &:hover {
    background-color: #e60000;
  }

  &:active {
    transform: scale(0.98);
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

function EditDispatch() {
  const [selectedDate, setSelectedDate] = useState(null); // Use state for MUI DatePicker
  const [dispatches, setDispatches] = useState([]);

  const fetchDispatches = async () => {
    if (!selectedDate) {
      toast.error('Please select a date.');
      return;
    }
    const formattedDate = dayjs(selectedDate).format('YYYY-MM-DD'); // Format the date
    try {
      const response = await Axios.get(`${import.meta.env.VITE_RMK_MESS_URL}/Dispatch/getDispatches/${formattedDate}`);
      setDispatches(response.data);
    } catch (error) {
      toast.error('Failed to fetch dispatches. Please try again.');
    }
  };

  const handleUpdate = async (dispatch) => {
    try {
      await Axios.post(`${import.meta.env.VITE_RMK_MESS_URL}/Dispatch/updateDispatch`, dispatch);
      toast.success('Dispatch updated successfully!');
      fetchDispatches(); // Refresh the dispatch list
    } catch (error) {
      console.error('Error updating dispatch:', error);
    }
  };

  const handleChange = (index, field, value) => {
    const updatedDispatches = [...dispatches];
    updatedDispatches[index][field] = value; // Update the specific field in the dispatch object
    setDispatches(updatedDispatches); // Update state with modified dispatches
  };

  const handleDelete = async (dispatch_id) => {
    if (window.confirm('Are you sure you want to delete this dispatch record?')) {
      try {
        await Axios.delete(`${import.meta.env.VITE_RMK_MESS_URL}/Dispatch/deleteDispatch/${dispatch_id}`);
        toast.success('Dispatch deleted successfully!');
        fetchDispatches(); // Refresh the list after deletion
      } catch (error) {
        toast.error('Failed to delete dispatch. Please try again.');
      }
    }
  };

  return (
    <Container>
      <h1>DISPATCH RECORDS</h1>
      <DatePickerContainer>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <DatePicker
            label="Select date"
            value={selectedDate}
            onChange={(newDate) => setSelectedDate(newDate)}
            renderInput={(params) => <input {...params} className="date-input" />}
          />
        </LocalizationProvider>
        <button className="fetch-button" onClick={fetchDispatches}>
          Fetch Dispatches
        </button>
      </DatePickerContainer>
      <TableHeader>
        <thead>
          <tr>
            <th>ITEM NAME</th>
            <th>QUANTITY</th>
            <th>LOCATION</th>
            <th>RECEIVER</th>
            <th>INCHARGE</th>
            <th>DISPATCH DATE</th>
            <th>ACTIONS</th>
          </tr>
        </thead>
        <tbody>
          {dispatches.length > 0 ? dispatches.map((dispatch, index) => (
            <tr key={dispatch.dispatch_id}>
              <td>{dispatch.item_name}</td>
              <td>{dispatch.quantity}</td>
              <td>
                <input
                  type="text"
                  value={dispatch.location}
                  onChange={(e) => handleChange(index, 'location', e.target.value)} // Update location
                />
              </td>
              <td>
                <input
                  type="text"
                  value={dispatch.receiver}
                  onChange={(e) => handleChange(index, 'receiver', e.target.value)} // Update receiver
                />
              </td>
              <td>
                <input
                  type="text"
                  value={dispatch.incharge}
                  onChange={(e) => handleChange(index, 'incharge', e.target.value)} // Update incharge
                />
              </td>
              <td>{moment(dispatch.dispatch_date).format('DD-MM-YYYY')}</td>
              <td>
                <UpdateButton onClick={() => handleUpdate(dispatch)}>Update</UpdateButton>
              </td>
            </tr>
          )) : (
            <tr>
              <td colSpan="7">No data available</td>
            </tr>
          )}
        </tbody>
      </TableHeader>
      <ToastContainer />
    </Container>
  );
}

export default EditDispatch;
