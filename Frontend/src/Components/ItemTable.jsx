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

const ItemsTableWithFilter = () => {
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [category, setCategory] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const tableRef = useRef();

  useEffect(() => {
    // Fetch all items on component mount
    Axios.get(`${import.meta.env.VITE_RMK_MESS_URL}/items`)
      .then((res) => {
        setItems(res.data);
        setFilteredItems(res.data); // Default to show all items
      })
      .catch((err) => {
        console.error('Error fetching items:', err);
        setError('Error fetching items');
      });
  }, []);

  const handlePrint = useReactToPrint({
    content: () => tableRef.current,
  });

  const handleFilter = async () => {
    if (!category.trim()) {
      setError('Category is required');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const response = await Axios.get(`${import.meta.env.VITE_RMK_MESS_URL}/expiry/filter-category`, {
        params: { category }, // Pass category as query parameter
      });

      if (response.data && response.data.length > 0) {
        setFilteredItems(response.data);
      } else {
        setFilteredItems([]); // If no items found for category
        setError('No items found for the given category');
      }
    } catch (err) {
      console.error('Error filtering items:', err);
      setError(
        err.response?.data?.error || 'An error occurred while filtering items.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFilteredItems(items); // Reset to show all items
    setCategory('');
    setError('');
  };

  return (
    <Container>
      <Title>Items Table</Title>

      {/* Filter Section */}
      <div style={{ marginBottom: '1rem' }}>
        <input
          type="text"
          placeholder="Enter category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          style={{ padding: '0.5rem', marginRight: '0.5rem' }}
        />
        <Button onClick={handleFilter}>Filter</Button>
        <Button onClick={handleReset} style={{ marginLeft: '10px' }}>
          Reset Filter
        </Button>
      </div>

      {loading && <p>Loading...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {/* Table Section */}
      <TableContainer ref={tableRef}>
        <Table>
          <thead>
            <tr>
              <Th>Item ID</Th>
              <Th>Item Name</Th>
              <Th>Unit</Th>
              <Th>Category</Th>
              <Th>Minimum Quantity</Th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.length > 0 ? (
              filteredItems.map((item) => (
                <tr key={item.item_id}>
                  <Td>{item.item_id}</Td>
                  <Td>{item.item_name}</Td>
                  <Td>{item.unit}</Td>
                  <Td>{item.category}</Td>
                  <Td>{item.min_quantity}</Td>
                </tr>
              ))
            ) : (
              <tr>
                <Td colSpan="5" style={{ textAlign: 'center' }}>
                  No items found.
                </Td>
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

export default ItemsTableWithFilter;
