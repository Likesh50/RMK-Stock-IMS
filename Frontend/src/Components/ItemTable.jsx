import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import Axios from 'axios';
import { useReactToPrint } from 'react-to-print';

// Styled components for the table
const Container = styled.div`
  max-width: 1000px;
  margin: 20px auto;
  padding: 20px;
  background-color: #f4f4f4;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
`;

const Title = styled.h1`
  text-align: center;
  margin-bottom: 20px;
`;

const TableContainer = styled.div`
  margin: 20px;
  padding: 20px;

  @media print {
    margin: 40px;
    padding: 20px;
  }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 20px;
`;

const Th = styled.th`
  padding: 10px;
  background-color: #4caf50;
  color: white;
  border: 1px solid #ddd;
  text-align: left;
`;

const Td = styled.td`
  padding: 10px;
  border: 1px solid #ddd;
`;

const Button = styled.button`
  padding: 10px 20px;
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.3s;

  &:hover {
    background-color: #45a049;
  }
`;

const App = () => {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const tableRef = useRef(null); // Define the tableRef

  // Fetch all items and categories when component mounts
  useEffect(() => {
    // Fetch all items
    Axios.get(`${import.meta.env.VITE_RMK_MESS_URL}/items/`)
      .then((response) => {
        setItems(response.data);
      })
      .catch((error) => {
        console.error('Error fetching items:', error);
      });

    // Fetch categories for the dropdown
    Axios.get(`${import.meta.env.VITE_RMK_MESS_URL}/items/categories`)
      .then((response) => {
        setCategories(response.data);
      })
      .catch((error) => {
        console.error('Error fetching categories:', error);
      });
  }, []);

  // Fetch items filtered by the selected category
  const handleCategoryChange = (event) => {
    const category = event.target.value;
    setSelectedCategory(category);

    // If no category is selected, fetch all items
    if (category === '') {
      Axios.get(`${import.meta.env.VITE_RMK_MESS_URL}/items/`)
        .then((response) => {
          setItems(response.data);
        })
        .catch((error) => {
          console.error('Error fetching all items:', error);
        });
    } else {
      // Fetch items filtered by category
      Axios.get(`${import.meta.env.VITE_RMK_MESS_URL}/items/filter-catg?category=${category}`)
        .then((response) => {
          setItems(response.data);
        })
        .catch((error) => {
          console.error('Error fetching filtered items:', error);
        });
    }
  };

  const handlePrint = useReactToPrint({
    content: () => tableRef.current,
  });

  return (
    <Container>
      <Title>Items Table</Title>

      {/* Filter Section */}
      <div style={{ marginBottom: '1rem', padding: '10px', backgroundColor: '#f9f9f9', borderRadius: '5px', border: '1px solid #ddd' }}>
  <label htmlFor="category" style={{ marginRight: '10px', fontWeight: 'bold' }}>Filter by Category: </label>
  <select
    id="category"
    value={selectedCategory}
    onChange={handleCategoryChange}
    style={{
      padding: '8px',
      borderRadius: '4px',
      border: '1px solid #ccc',
      fontSize: '16px',
      cursor: 'pointer',
      width: '200px'
    }}
  >
    <option value="">Select Category</option>
    {categories.map((category, index) => (
      <option key={index} value={category}>
        {category}
      </option>
    ))}
  </select>
</div>


      {/* Display the item table */}
      <TableContainer ref={tableRef}>
        <Table>
          <thead>
            <tr>
              <Th>Item Name</Th>
              <Th>Unit</Th>
              <Th>Category</Th>
              <Th>Min Quantity</Th>
            </tr>
          </thead>
          <tbody>
            {items.length > 0 ? (
              items.map((item) => (
                <tr key={item.item_id}>
                  <Td>{item.item_name}</Td>
                  <Td>{item.unit}</Td>
                  <Td>{item.category}</Td>
                  <Td>{item.min_quantity}</Td>
                </tr>
              ))
            ) : (
              <tr>
                <Td colSpan="4">No items found</Td>
              </tr>
            )}
          </tbody>
        </Table>
      </TableContainer>

      {/* Print Button */}
      <Button onClick={handlePrint}>Print Table</Button>
    </Container>
  );
};

export default App;
