import React, { useState, useRef, useEffect } from "react";
import styled from "styled-components";
import axios from "axios";
import { Autocomplete, TextField } from "@mui/material";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { HashLoader } from "react-spinners";
import { MenuItem } from "@mui/material";
import { jwtDecode } from "jwt-decode";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button
} from "@mui/material";


// ✅ Styled Components
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
  justify-content: center;
`;
const ItemTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-family: Arial, sans-serif;
  margin-top: 20px;

  th, td {
    border: 1px solid #ddd;
    padding: 12px;
    text-align: left;
  }
  th {
    background-color: #164863;
    color: white;
  }
  tbody tr:nth-child(even) {
    background-color: #f9f9f9;
  }
`;
const SubmitButton = styled.button`
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  background-color: #4caf50;
  color: white;
  margin-top: 20px;
  font-size: 16px;
  cursor: pointer;
  &:hover {
    background-color: #45a049;
  }
`;
const DeleteButton = styled.button`
  background-color: #d9534f;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 6px 10px;
  cursor: pointer;
  &:hover {
    background-color: #c9302c;
  }
`;

function Transfer() {
  const [rows, setRows] = useState([
    { id: Date.now(), category: "", item: "", quantity: "", receivingLocation: "" },
  ]);
  const [subcategories, setSubcategories] = useState([]);
  const [itemsByRowId, setItemsByRowId] = useState({});
  const [availableStock, setAvailableStock] = useState({});
  const [locations, setLocations] = useState([]);
  const [selectedReceivingLocation, setSelectedReceivingLocation] = useState("");
  const [loading, setLoading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);


const token = window.sessionStorage.getItem("token");
let userId = null;

if (token) {
  const decoded = jwtDecode(token);
  userId = decoded.id;
  console.log("User ID:", userId);
}
  useEffect(() => {
  setShowConfirmDialog(true);
}, []);
const [currentLocationName, setCurrentLocationName] = useState("");

useEffect(() => {
  const stored = sessionStorage.getItem("userlocations");
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      const currentLocationId = parseInt(localStorage.getItem("locationid"), 10);
      const loc = parsed.find(l => l.location_id === currentLocationId);
      if (loc) setCurrentLocationName(loc.location_name);
    } catch (err) {
      console.error("Invalid JSON in sessionStorage for userlocations:", err);
    }
  }
}, []);

  const fetchLocations = async () => {
    try {
      const currentLocationId = parseInt(localStorage.getItem("locationid"), 10);

      const response = await axios.get(`${import.meta.env.VITE_RMK_MESS_URL}/locations`);
      if (response.data) {
        const filtered = response.data.filter(
          (loc) => loc.location_id !== currentLocationId
        );
        setLocations(filtered);
      }
    } catch {
      toast.error("Error fetching location details");
    }
  };


  // ✅ Fetch subcategories
  const fetchSubcategories = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_RMK_MESS_URL}/purchase/subcategories`);
      const subs = Array.from(
        new Set(
          response.data
            .map((item) => item.sub_category)
            .filter((s) => s && s.trim() !== "")
        )
      );
      setSubcategories(subs);
    } catch {
      toast.error("Error fetching subcategories");
    }
  };

  useEffect(() => {
    fetchLocations();
    fetchSubcategories();
  }, []);

  // ✅ Fetch items for a subcategory
  const fetchItemsForSubcategory = async (subcategory, rowId) => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_RMK_MESS_URL}/purchase/getItemsBySubcategory`, {
        params: { subcategory },
      });
      setItemsByRowId((prev) => ({ ...prev, [rowId]: response.data }));
    } catch {
      toast.error("Error fetching items");
    }
  };

  // ✅ Fetch available stock for item in current location
  const fetchAvailableStock = async (rowId, itemId) => {
    try {
      const locationId = parseInt(localStorage.getItem("locationid"), 10); // current location
      const response = await axios.get(
        `${import.meta.env.VITE_RMK_MESS_URL}/dispatch/stockAvailability/${itemId}/${locationId}`
      );
      setAvailableStock((prev) => ({ ...prev, [rowId]: response.data || [] }));
    } catch {
      toast.error("Error fetching stock availability");
    }
  };

  // ✅ Handle row input change
  const handleInputChange = async (id, field, value) => {
    if (field === "category") {
      fetchItemsForSubcategory(value, id);
      setRows((prev) =>
        prev.map((r) => (r.id === id ? { ...r, category: value, item: "" } : r))
      );
      return;
    }

    if (field === "item") {
      setRows((prev) =>
        prev.map((r) => (r.id === id ? { ...r, item: value, quantity: "" } : r))
      );
      if (value) await fetchAvailableStock(id, value);
      return;
    }

    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  };

  // ✅ Add new row
  const handleAddRow = () => {
    setRows((prev) => [...prev, { id: Date.now(), category: "", item: "", quantity: "" }]);
  };

  // ✅ Delete row
  const handleDeleteRow = (id) => {
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  // ✅ Submit transfer
const handleSubmit = async () => {
  if (!selectedReceivingLocation) {
    toast.error("Please select a receiving location first!");
    return;
  }

  const token = window.sessionStorage.getItem("token");
  let userId = null;
  if (token) {
    const decoded = jwtDecode(token);
    userId = decoded.id; // extract from token
  }

  const arr = rows.map((row) => ({
    item_id: row.item,
    quantity: parseFloat(row.quantity),
    to_location_id: selectedReceivingLocation,
  }));

  try {
    setLoading(true);
    await axios.post(`${import.meta.env.VITE_RMK_MESS_URL}/transfer/createTransfer`, {
      arr,
      from_location_id: parseInt(localStorage.getItem("locationid"), 10),
      done_by_user_id: userId,   // ✅ send userId to backend
    });
    toast.success("Transfer successful!");
    setRows([{ id: Date.now(), category: "", item: "", quantity: "" }]);
  } catch (err) {
    toast.error("Error submitting transfer");
  } finally {
    setLoading(false);
  }
};


  return (
    <Container>
      {loading && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "rgba(255, 255, 255, 0.7)",
          }}
        >
          <HashLoader color="#164863" loading={loading} size={90} />
        </div>
      )}
      <h1>TRANSFER</h1>

      {/* Receiving location dropdown */}
      <FormContainer>
  <TextField
    select
    label="Receiving Location"
    value={selectedReceivingLocation}
    onChange={(e) => setSelectedReceivingLocation(e.target.value)}
    size="small"
    variant="outlined"x
    sx={{
      minWidth: 220,
      backgroundColor: "white",
      borderRadius: "8px",
      "& .MuiOutlinedInput-root": {
        "& fieldset": {
          borderColor: "#164863",
        },
        "&:hover fieldset": {
          borderColor: "#0f3057",
        },
        "&.Mui-focused fieldset": {
          borderColor: "#4caf50",
        },
      },
    }}
  >
    <MenuItem value="">— Select Receiving Location —</MenuItem>
    {locations.map((loc) => (
      <MenuItem key={loc.location_id} value={loc.location_id}>
        {loc.location_name}
      </MenuItem>
    ))}
  </TextField>

  <SubmitButton type="button" onClick={handleAddRow}>
    Add Row
  </SubmitButton>
</FormContainer>

      {/* Transfer Table */}
      {/* Transfer Table */}
<ItemTable>
  <thead>
    <tr>
      <th>SNo</th>
      <th>Sub Category</th>
      <th>Item</th>
      <th>Available</th>
      <th>Quantity</th>
      <th>Actions</th>
    </tr>
  </thead>
  <tbody>
    {rows.map((row, index) => (
      <tr key={row.id}>
        <td>{index + 1}</td>
        <td>
          <Autocomplete
            options={subcategories}
            value={row.category}
            onChange={(e, newValue) => handleInputChange(row.id, "category", newValue || "")}
            renderInput={(params) => (
              <TextField {...params} label="Subcategory" variant="outlined" size="small" />
            )}
            sx={{ width: 150 }}
            freeSolo
          />
        </td>
        <td>
          <Autocomplete
            options={(itemsByRowId[row.id] || []).map((i) => ({
              label: i.item_name,
              id: i.item_id,
            }))}
            value={
              itemsByRowId[row.id]?.find((i) => i.item_id === row.item)
                ? {
                    label: itemsByRowId[row.id].find((i) => i.item_id === row.item).item_name,
                    id: row.item,
                  }
                : null
            }
            onChange={(e, newValue) => handleInputChange(row.id, "item", newValue?.id || "")}
            renderInput={(params) => (
              <TextField {...params} label="Item" variant="outlined" size="small" />
            )}
            sx={{ width: 180 }}
            disabled={!row.category}
          />
        </td>
        <td>{availableStock[row.id]?.[0]?.quantity ?? "N/A"}</td>
        <td>
          <input
            type="number"
            value={row.quantity}
            onChange={(e) => handleInputChange(row.id, "quantity", e.target.value)}
            min={0}
          />
        </td>
        <td>
          <DeleteButton onClick={() => handleDeleteRow(row.id)}>Delete</DeleteButton>
        </td>
      </tr>
    ))}
  </tbody>
</ItemTable>


      <div style={{ textAlign: "center" }}>
        <SubmitButton onClick={handleSubmit}>Submit Transfer</SubmitButton>
      </div>
      <ToastContainer />
      <Dialog open={showConfirmDialog} onClose={() => setShowConfirmDialog(false)}>
  <DialogTitle>Confirm Transfer</DialogTitle>
  <DialogContent>
    <DialogContentText>
      Are you sure you want to start entering transfers for location
      <strong> {currentLocationName} </strong>?
    </DialogContentText>
  </DialogContent>
  <DialogActions>
    <Button onClick={() => setShowConfirmDialog(false)} color="secondary">
      Cancel
    </Button>
    <Button
      onClick={() => setShowConfirmDialog(false)}
      color="primary"
      variant="contained"
    >
      Confirm
    </Button>
  </DialogActions>
</Dialog>

    </Container>
  );
}

export default Transfer;
