import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import Axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css'; // Import the styles

const Container = styled.div`
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
  background-color: #f4f4f4;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
`;

const Input = styled.input`
  padding: 10px;
  margin: 10px 0;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 16px;
  outline: none;
  background-color: #fff;
  &:focus {
    border-color: #4caf50;
    box-shadow: 0 0 8px rgba(76, 175, 80, 0.3);
  }
`;

const Select = styled.select`
  padding: 10px;
  margin: 10px 0;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 16px;
  background-color: #fff;
  outline: none;
  &:focus {
    border-color: #4caf50;
    box-shadow: 0 0 8px rgba(76, 175, 80, 0.3);
  }
`;

const Button = styled.button`
  padding: 10px;
  margin-top: 10px;
  border: none;
  border-radius: 4px;
  background-color: ${props => (props.delete ? '#e74c3c' : '#4caf50')};
  color: white;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.3s;

  &:hover {
    background-color: ${props => (props.delete ? '#c0392b' : '#45a049')};
  }
`;

const Label = styled.label`
  margin: 10px 0 5px;
  font-size: 16px;
  font-weight: bold;
`;

const UpdateItems = () => {
  const [items, setItems] = useState([]); // State to store all items for the dropdown
  const [categories, setCategories] = useState([]); // State to store categories
  const [subcategories, setsubCategories] = useState([]);
  const [itemData, setItemData] = useState({
    item_name: '',
    unit: '',
    category: '',
    sub_category: '',
    min_quantity: 0,
  });
  const [selectedItemId, setSelectedItemId] = useState(''); // State to track selected item ID
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    // Fetch all items for the dropdown when the component mounts
    Axios.get(`${import.meta.env.VITE_RMK_MESS_URL}/items`)
      .then(res => {
        setItems(res.data); // Assuming the API returns an array of items
      })
      .catch(err => console.error('Error fetching items:', err));
  }, []);

  useEffect(() => {
    // Fetch the selected item's details when selectedItemId is set
    if (selectedItemId) {
      Axios.get(`${import.meta.env.VITE_RMK_MESS_URL}/items/${selectedItemId}`)
        .then(res => {
          setItemData(res.data); // Set the item details in the form
          
        })
        .catch(err => console.error('Error fetching item details:', err));
    }
  }, [selectedItemId]);

  useEffect(() => {
    // Fetch categories for the category dropdown
    Axios.get(`${import.meta.env.VITE_RMK_MESS_URL}/addItems/getcategory`)
      .then(res => {
        setCategories(res.data);
        setsubCategories(res.data); 
        console.log(res.data)// Assuming the API returns an array of categories
      })
      .catch(err => console.error('Error fetching categories:', err));
  }, []);

   

  const handleInputChange = e => {
    setItemData({
      ...itemData,
      [e.target.name]: e.target.value,
    });
  };

  const handleUpdateItem = e => {
    e.preventDefault();

    Axios.put(`${import.meta.env.VITE_RMK_MESS_URL}/items/${selectedItemId}`, itemData)
      .then(res => {
        toast.success('Item updated successfully!');
      })
      .catch(err => {
        console.error('Error updating item:', err);
        toast.error('Error updating item.');
      });
  };

  return (
    <Container>
      <h1>Update or Delete Item</h1>

      {/* Dropdown to select an item */}
      <Label htmlFor="item_select">Select Item:</Label>
      <Select
        id="item_select"
        value={selectedItemId}
        onChange={e => setSelectedItemId(e.target.value)}
      >
        <option value="">Select an item</option>
        {items.map(item => (
          <option key={item.item_id} value={item.item_id}>
            {item.item_name}
          </option>
        ))}
      </Select>

      {selectedItemId && (
        <Form onSubmit={handleUpdateItem}>
          <Label>Item Name:</Label>
          <Input
            type="text"
            name="item_name"
            value={itemData.item_name}
            onChange={handleInputChange}
          />

          <Label>Unit:</Label>
          <Input
            type="text"
            name="unit"
            value={itemData.unit}
            onChange={handleInputChange}
          />

          <Label>Category:</Label>
          <Select
            name="category"
            value={itemData.category}
            onChange={handleInputChange}
          >
            <option value="">Select a category</option>
            {categories.map((category,idx) => (
              <option key={idx} value={category.category}>
                {category.category}
              </option>
            ))}
          </Select>
          
          <Label>Sub Category:</Label>
          <Select
            name="sub_category"
            value={itemData.sub_category}
            onChange={handleInputChange}
          >
            <option value="">Select a Sub category</option>
            {subcategories.map((subcat, idx) => (
            <option key={idx} value={subcat.sub_category}>
              {subcat.sub_category}
            </option>
          ))}

          </Select>

          <Label>Minimum Quantity:</Label>
          <Input
            type="number"
            name="min_quantity"
            value={itemData.min_quantity}
            onChange={handleInputChange}
          />

          {/* Update Button */}
          <Button type="submit">Update Item</Button>

          {/* Success message */}
          {successMessage && <p>{successMessage}</p>}
        </Form>
      )}
      <ToastContainer />
    </Container>
  );
};

export default UpdateItems;
