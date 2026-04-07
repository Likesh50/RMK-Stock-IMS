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
  color: #164863; /* ✅ same as Available Stock */
  font-weight: 700;
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
  @media print {
  .print-header {
    display: block !important;
  }
}
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 20px;
`;

const Th = styled.th`
  padding: 10px;
  background-color: #3582ab; /* ✅ match Available Stock */
  color: white;
  border: 1px solid #ddd;
  text-align: left;
  font-size: 14px;
  font-weight: bold;
`;
const Td = styled.td`
  padding: 10px;
  border: 1px solid #ddd;
  font-size: 14px;
  color: #222; /* slightly darker like AvailableStock */
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
  border: 1px solid #164863;
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
  const [subcategories, setSubcategories] = useState([]);
  const [selectedSubcategory, setSelectedSubcategory] = useState('All');

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

        // Extract subcategories based on category
        const uniqueSubcategories = [
          'All',
          ...Array.from(new Set(data.map(i => i.sub_category).filter(Boolean))).sort()
        ];
        setSubcategories(uniqueSubcategories);
      })
      .catch((err) => console.error('Error fetching items:', err));
  }, []);


  // 🔥 FILTER + SORT LOGIC
  useEffect(() => {
  let data = [...items];

  if (selectedCategory !== 'All') {
    data = data.filter(i => i.category === selectedCategory);

    // 🔥 Subcategory depends on category
    const subcats = [
      'All',
      ...Array.from(
        new Set(
          data.map(i => i.sub_category).filter(Boolean)
        )
      ).sort()
    ];
    setSubcategories(subcats);
  }

  if (selectedSubcategory !== 'All') {
    data = data.filter(i => i.sub_category === selectedSubcategory);
  }

  // Sort always by category
  data.sort((a, b) =>
    (a.category || '').localeCompare(b.category || '')
  );

  setFilteredItems(data);
}, [items, selectedCategory, selectedSubcategory]);
  
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
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setSelectedSubcategory('All'); // reset
              }}
            >
              {categories.map((cat, index) => (
                <option key={index} value={cat}>
                  {cat}
                </option>
              ))}
            </Select>

            <label style={{ fontWeight: "600" }}>Subcategory:</label>

            <Select
              value={selectedSubcategory}
              onChange={(e) => setSelectedSubcategory(e.target.value)}
            >
              {subcategories.map((sub, index) => (
                <option key={index} value={sub}>
                  {sub}
                </option>
              ))}
            </Select>
            </RightControls>
      </TopBar>

      <TableContainer ref={tableRef}>
        <div className="print-header" style={{ display: 'none' }}>

            {/* ✅ REPORT TITLE */}
            <div style={{
              textAlign: 'center',
              fontSize: '22px',
              fontWeight: '700',
              marginBottom: '12px',
              color: '#164863',          // ✅ BLUE THEME
              letterSpacing: '0.5px'
            }}>
              ITEMS TABLE
            </div>

            {/* ✅ CATEGORY + SUBCATEGORY */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '12px',
              fontWeight: '600',
              color: '#164863',          // ✅ BLUE THEME
              fontSize: '15px'
            }}>
              <div>
                <span style={{ fontWeight: 700 }}>Category:</span> {selectedCategory}
              </div>

              <div>
                <span style={{ fontWeight: 700 }}>Subcategory:</span> {selectedSubcategory}
              </div>
            </div>

            {/* ✅ OPTIONAL DIVIDER (matches professional reports) */}
            <div style={{
              borderBottom: '2px solid #3582ab',
              marginBottom: '10px'
            }} />

          </div>
        <Table>
          <thead>
            <tr>
              <Th>S.NO</Th>
              <Th>Item ID</Th>
              <Th>Item Name</Th>
              <Th>Unit</Th>
              <Th>Category</Th>
              <Th>Subcategory</Th>
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
                <Td>{item.sub_category}</Td>
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