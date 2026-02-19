import React, { useState, useEffect } from "react";
import styled from "styled-components";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { HashLoader } from "react-spinners";

const Container = styled.div`
  h1 {
    color: #164863;
    text-align: center;
    margin-bottom: 20px;
  }
`;

const FormContainer = styled.div`
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-bottom: 20px;
`;

const Input = styled.input`
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 6px;
  width: 250px;
`;

const AddButton = styled.button`
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  background-color: #3582ab;;
  color: white;
  cursor: pointer;

  &:hover {
    background-color: #0a3d62;
  }
`;

const ItemTable = styled.table`
  width: 70%;
  margin: auto;
  border-collapse: collapse;
  font-family: Arial, sans-serif;

  th,
  td {
    border: 1px solid #ddd;
    padding: 12px;
    text-align: center;
  }

  th {
    background-color: #3582ab;;
    color: white;
  }

  tbody tr:nth-child(even) {
    background-color: #f1f1f1;
  }

  tbody tr:hover {
    background-color: #e0f7fa;
  }
`;

const EditInput = styled.input`
  padding: 6px;
  width: 90%;
`;

const ActionButton = styled.button`
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  margin: 0 4px;
  cursor: pointer;
  color: white;

  &.edit {
    background-color: #007bff;
  }

  &.delete {
    background-color: #d9534f;
  }

  &:hover {
    opacity: 0.9;
  }
`;

function Shops() {
  const [shops, setShops] = useState([]);
  const [newName, setNewName] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editAddress, setEditAddress] = useState("");

  // ✅ Fetch shops
  const fetchShops = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${import.meta.env.VITE_RMK_MESS_URL}/shops`);
      setShops(res.data);
    } catch (err) {
      toast.error("Failed to fetch shops");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShops();
  }, []);

  // ✅ Add shop
  const handleAdd = async () => {
    if (!newName.trim() || !newAddress.trim()) {
      toast.warn("Both name and address are required");
      return;
    }
    try {
      setLoading(true);
      await axios.post(`${import.meta.env.VITE_RMK_MESS_URL}/shops`, {
        name: newName,
        address: newAddress,
      });
      toast.success("Shop added successfully");
      setNewName("");
      setNewAddress("");
      fetchShops();
    } catch (err) {
      toast.error("Failed to add shop");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Update shop
  const handleUpdate = async (id) => {
    if (!editName.trim() || !editAddress.trim()) {
      toast.warn("Both name and address are required");
      return;
    }
    try {
      setLoading(true);
      await axios.put(`${import.meta.env.VITE_RMK_MESS_URL}/shops/${id}`, {
        name: editName,
        address: editAddress,
      });
      toast.success("Shop updated");
      setEditId(null);
      setEditName("");
      setEditAddress("");
      fetchShops();
    } catch (err) {
      toast.error("Failed to update shop");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Delete shop
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this shop?")) return;

    try {
      setLoading(true);
      await axios.delete(`${import.meta.env.VITE_RMK_MESS_URL}/shops/${id}`);
      toast.success("Shop deleted");
      fetchShops();
    } catch (err) {
      toast.error("Failed to delete shop");
      console.error(err);
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
            top: "0",
            left: "0",
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

      <h1>SHOPS MANAGEMENT</h1>

      <FormContainer>
        <Input
          type="text"
          placeholder="Enter shop name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
        />
        <Input
          type="text"
          placeholder="Enter address"
          value={newAddress}
          onChange={(e) => setNewAddress(e.target.value)}
        />
        <AddButton onClick={handleAdd}>Add Shop</AddButton>
      </FormContainer>

      <ItemTable>
        <thead>
          <tr>
            <th>ID</th>
            <th>Shop Name</th>
            <th>Address</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {shops.map((shop) => (
            <tr key={shop.id}>
              <td>{shop.id}</td>
              <td>
                {editId === shop.id ? (
                  <EditInput
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                  />
                ) : (
                  shop.name
                )}
              </td>
              <td>
                {editId === shop.id ? (
                  <EditInput
                    value={editAddress}
                    onChange={(e) => setEditAddress(e.target.value)}
                  />
                ) : (
                  shop.location
                )}
              </td>
              <td>
                {editId === shop.id ? (
                  <>
                    <ActionButton
                      className="edit"
                      onClick={() => handleUpdate(shop.id)}
                    >
                      Save
                    </ActionButton>
                    <ActionButton
                      onClick={() => {
                        setEditId(null);
                        setEditName("");
                        setEditAddress("");
                      }}
                    >
                      Cancel
                    </ActionButton>
                  </>
                ) : (
                  <>
                    <ActionButton
                      className="edit"
                      onClick={() => {
                        setEditId(shop.id);
                        setEditName(shop.name);
                        setEditAddress(shop.location);
                      }}
                    >
                      Edit
                    </ActionButton>
                    <ActionButton
                      className="delete"
                      onClick={() => handleDelete(shop.id)}
                    >
                      Delete
                    </ActionButton>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </ItemTable>

      <ToastContainer />
    </Container>
  );
}

export default Shops;
