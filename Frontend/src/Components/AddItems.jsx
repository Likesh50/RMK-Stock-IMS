import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Styled Components
const Container = styled.div` padding: 0px; text-align: center; `;
const Heading = styled.h1` color: #164863; margin-bottom: 20px; `;
const SubHeading = styled.h3` color: #164863; margin-top: 20px; `;
const Table = styled.table` width: 80%; border-collapse: collapse; text-align: center; margin-left: 140px; `;
const Th = styled.th` background-color: #164863; color: white; padding: 10px; border: 1px solid #ddd; width: 200px; `;
const Td = styled.td` padding: 10px; border: 1px solid #ddd; width: 200px; `;
const Input = styled.input` width: 100%; padding: 8px; box-sizing: border-box; border: 1px solid #ccc; border-radius: 4px; font-size: 14px; &:focus { outline: 2px solid #164863; } `;
const Select = styled.select` width: 100%; padding: 8px; box-sizing: border-box; border: 1px solid #ccc; border-radius: 4px; font-size: 14px; `;
const SubmitContainer = styled.div` margin-top: 20px; text-align: center; .add-button { padding: 10px 20px; border: none; border-radius: 4px; background-color: #164863; color: white; font-size: 16px; cursor: pointer; margin-right: 10px; &:hover { background-color: #0a3d62; } &:active { transform: scale(0.98); } } `;
const SubmitButton = styled.button` padding: 10px 20px; border: none; border-radius: 4px; background-color: #4caf50; color: white; font-size: 16px; cursor: pointer; &:hover { background-color: #45a049; } &:active { transform: scale(0.98); } `;
const ErrorText = styled.div` color: red; margin-top: 20px; font-size: 32px; `;

const AddItems = () => {
  const [itemName, setItemName] = useState("");
  const [categoryList, setCategoryList] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [itemsAvail, setItemsAvail] = useState([]);

  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSubCategory, setSelectedSubCategory] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [newSubCategory, setNewSubCategory] = useState("");
  const [unit, setUnit] = useState("");
  const [minimum, setMinimum] = useState("");

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_RMK_MESS_URL}/addItems/getCategory`);
        setCategoryList(response.data); // Expecting [{category: 'Electrical', sub_category: 'Switches'}, ...]
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };

    const fetchItemsAvail = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_RMK_MESS_URL}/addItems/getItemCategory`);
        setItemsAvail(response.data);
      } catch (error) {
        console.error("Error fetching existing items:", error);
      }
    };

    fetchCategories();
    fetchItemsAvail();
  }, []);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setItemName(value);
    if (value) {
      const filtered = itemsAvail.filter(item =>
        item.item_name.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredItems(filtered);
    } else {
      setFilteredItems([]);
    }
  };

  const uniqueCategories = [...new Set(categoryList.map(item => item.category))];

  const subCategoriesForSelected = categoryList
    .filter(item => item.category === selectedCategory)
    .map(item => item.sub_category)
    .filter((v, i, a) => a.indexOf(v) === i); // Unique

  const handleSubmit = async () => {
    const finalCategory = selectedCategory === "Others" ? newCategory : selectedCategory;
    const finalSubCategory = selectedSubCategory === "Others" ? newSubCategory : selectedSubCategory;

    if (!itemName || !finalCategory || !finalSubCategory || !unit || !minimum) {
      toast.error("Please fill in all fields.");
      return;
    }

    try {
      await axios.post(`${import.meta.env.VITE_RMK_MESS_URL}/addItems/insert`, {
        itemName,
        category: finalCategory,
        subCategory: finalSubCategory,
        unit,
        minimum
      });

      toast.success("Item added successfully!");

      // Reset all fields
      setItemName("");
      setSelectedCategory("");
      setSelectedSubCategory("");
      setNewCategory("");
      setNewSubCategory("");
      setUnit("");
      setMinimum("");
      setFilteredItems([]);
      window.location.reload();
    } catch (error) {
      toast.error(error.response?.data || 'Error adding item.');
    }
  };

  return (
    <Container>
      <Heading>Add Items</Heading>
      <Table>
        <thead>
          <tr>
            <Th>SNo</Th>
            <Th>Item Name</Th>
            <Th>Category</Th>
            <Th>Sub Category</Th>
            <Th>Minimum Quantity</Th>
            <Th>Unit</Th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <Td>1</Td>
            <Td><Input value={itemName} placeholder="Item Name" onChange={handleInputChange} /></Td>

            {/* CATEGORY SELECT */}
            <Td>
              <Select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
                <option value="" disabled>Select Category</option>
                {uniqueCategories.map((cat, idx) => (
                  <option key={idx} value={cat}>{cat}</option>
                ))}
                <option value="Others">Others</option>
              </Select>
              {selectedCategory === "Others" && (
                <Input
                  placeholder="Enter new category"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                />
              )}
            </Td>

            {/* SUB CATEGORY SELECT */}
            <Td>
              <Select value={selectedSubCategory} onChange={(e) => setSelectedSubCategory(e.target.value)}>
                <option value="" disabled>Select Sub Category</option>
                {subCategoriesForSelected.map((sub, idx) => (
                  <option key={idx} value={sub}>{sub}</option>
                ))}
                <option value="Others">Others</option>
              </Select>
              {selectedSubCategory === "Others" && (
                <Input
                  placeholder="Enter new sub-category"
                  value={newSubCategory}
                  onChange={(e) => setNewSubCategory(e.target.value)}
                />
              )}
            </Td>

            <Td><Input type="number" value={minimum} placeholder="Min Qty" onChange={(e) => setMinimum(e.target.value)} /></Td>
            <Td><Input value={unit} placeholder="Unit" onChange={(e) => setUnit(e.target.value)} /></Td>
          </tr>
        </tbody>
      </Table>

      <SubmitContainer>
        <SubmitButton onClick={handleSubmit}>Add</SubmitButton>
      </SubmitContainer>

      <SubHeading>Existing Items That Match</SubHeading>
      {filteredItems.length > 0 && (
        <Table className="table table-bordered">
          <thead>
            <tr>
              <Th>Item Name</Th>
              <Th>Category</Th>
              <Th>Minimum Quantity</Th>
              <Th>Unit</Th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.map((item, idx) => (
              <tr key={idx}>
                <Td>{item.item_name}</Td>
                <Td>{item.category}</Td>
                <Td>{item.min_quantity}</Td>
                <Td>{item.unit}</Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      <ToastContainer />
    </Container>
  );
};

export default AddItems;
  