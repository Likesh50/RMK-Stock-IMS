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

const TopBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 10px 0 20px;
  padding: 10px 5px;
`;

const RightControls = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
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

  &:hover {
    background-color: #45a049;
  }
`;

const Select = styled.select`
  padding: 8px 12px;
  border-radius: 6px;
  border: 1px solid #bbb;
  font-size: 14px;
  min-width: 160px;
  background-color: white;

  &:focus {
    outline: none;
    border-color: #4caf50;
    box-shadow: 0 0 3px rgba(76, 175, 80, 0.4);
  }
`;

const ItemsTable = () => {
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');

  const tableRef = useRef();

  useEffect(() => {
    Axios.get(`${import.meta.env.VITE_RMK_MESS_URL}/items`)
      .then((res) => {
        const data = res.data || [];
        setItems(data);

        // Extract categories
        const uniqueCategories = [
          'All',
          ...Array.from(new Set(data.map(i => i.category).filter(Boolean))).sort()
        ];
        setCategories(uniqueCategories);
      })
      .catch((err) => console.error('Error fetching items:', err));
  }, []);

  // 🔥 FILTER + SORT LOGIC
  useEffect(() => {
    let data = [...items];

    if (selectedCategory !== 'All') {
      data = data.filter(i => i.category === selectedCategory);
    } else {
      // Sort by category when "All"
      data.sort((a, b) =>
        (a.category || '').localeCompare(b.category || '')
      );
    }

    setFilteredItems(data);
  }, [items, selectedCategory]);

  const handlePrint = useReactToPrint({
    content: () => tableRef.current,
  });

  return (
    <Container>
      <Title>Items Table</Title>

      {/* 🔥 TOP BAR */}
      <TopBar>
        <Button onClick={handlePrint}>Print Table</Button>
        <RightControls>
          <label style={{ fontWeight: "600" }}>Category:</label>

          <Select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
                {categories.map((cat, index) => (
                  <option key={index} value={cat}>
                    {cat}
                  </option>
                ))}
              </Select>
            </RightControls>
      </TopBar>

      <TableContainer ref={tableRef}>
        <Table>
          <thead>
            <tr>
              <Th>S.NO</Th>
              <Th>Item ID</Th>
              <Th>Item Name</Th>
              <Th>Unit</Th>
              <Th>Category</Th>
              <Th>Minimum Quantity</Th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.map((item, i) => (
              <tr key={item.item_id}>
                <Td>{i + 1}</Td>
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
    </Container>
  );
};

export default ItemsTable;