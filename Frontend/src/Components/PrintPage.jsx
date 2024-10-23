import React, { useEffect } from 'react';
import styled from 'styled-components';

// Styled components for the print table
const Container = styled.div`
  max-width: 1000px;
  margin: 20px auto;
  padding: 20px;
  background-color: #fff;
`;

const Title = styled.h1`
  text-align: center;
  margin-bottom: 20px;
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

const PrintPage = ({ items }) => {
  useEffect(() => {
    // Automatically trigger the print dialog when the component mounts
    window.print();
  }, []);

  return (
    <Container>
      <Title>Items Table</Title>
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
    </Container>
  );
};

export default PrintPage;
