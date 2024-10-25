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
  
  /* Print-specific styles */
  @media print {
    margin: 40px;
    padding: 20px;
    /* You can add more print-specific styles here */
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

const ItemsTable = () => {
  const [items, setItems] = useState([]);
  const tableRef = useRef(); // Create a ref for the table

  useEffect(() => {
    // Fetch the items from the backend
    Axios.get(`${import.meta.env.VITE_RMK_MESS_URL}/items`)
      .then((res) => {
        setItems(res.data);
      })
      .catch((err) => console.error('Error fetching items:', err));
  }, []);

  // useReactToPrint to handle printing
  const handlePrint = useReactToPrint({
    content: () => tableRef.current, // Reference the table component
  });

  return (
    <Container>
      <Title>Items Table</Title>
      <Button sty onClick={handlePrint}>Print Table</Button>
      {/* Table with print-specific margins */}
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
            {items.map((item) => (
              <tr key={item.item_id}>
                <Td>{item.item_id}</Td>
                <Td>{item.item_name}</Td>
                <Td>{item.unit}</Td>
                <Td>{item.category}</Td>
                <Td>{item.min_quantity}</Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </TableContainer>
      
      {/* Print button */}
     
    </Container>
  );
};

export default ItemsTable;
