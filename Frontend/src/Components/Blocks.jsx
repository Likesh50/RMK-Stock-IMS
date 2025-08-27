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
  background-color: #164863;
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
    background-color: #164863;
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

function Blocks() {
  const [blocks, setBlocks] = useState([]);
  const [newBlock, setNewBlock] = useState("");
  const [loading, setLoading] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState("");

  // ✅ location_id from localStorage
  const [selectedId] = useState(() => {
    return localStorage.getItem("locationid") || "";
  });

  // ✅ Fetch blocks (filtered by location_id)
  const fetchBlocks = async () => {
    if (!selectedId) {
      toast.error("No location selected");
      return;
    }
    try {
      setLoading(true);
      const res = await axios.get(
        `${import.meta.env.VITE_RMK_MESS_URL}/blocks?location_id=${selectedId}`
      );
      setBlocks(res.data);
    } catch (err) {
      toast.error("Failed to fetch blocks");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlocks();
  }, [selectedId]);

  // ✅ Add block with location_id
  const handleAdd = async () => {
    if (!newBlock.trim()) {
      toast.warn("Block name cannot be empty");
      return;
    }
    if (!selectedId) {
      toast.error("No location selected");
      return;
    }
    try {
      setLoading(true);
      await axios.post(`${import.meta.env.VITE_RMK_MESS_URL}/blocks`, {
        block_name: newBlock,
        location_id: selectedId, // ✅ include location_id
      });
      toast.success("Block added successfully");
      setNewBlock("");
      fetchBlocks();
    } catch (err) {
      toast.error("Failed to add block");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Update block (block_name only, location stays same)
  const handleUpdate = async (id) => {
    if (!editName.trim()) {
      toast.warn("Block name cannot be empty");
      return;
    }
    try {
      setLoading(true);
      await axios.put(`${import.meta.env.VITE_RMK_MESS_URL}/blocks/${id}`, {
        block_name: editName,
        location_id: selectedId, // ✅ send location_id also for safety
      });
      toast.success("Block updated");
      setEditId(null);
      setEditName("");
      fetchBlocks();
    } catch (err) {
      toast.error("Failed to update block");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Delete block
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this block?")) return;

    try {
      setLoading(true);
      await axios.delete(`${import.meta.env.VITE_RMK_MESS_URL}/blocks/${id}`);
      toast.success("Block deleted");
      fetchBlocks();
    } catch (err) {
      toast.error("Failed to delete block");
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

      <h1>BLOCKS MANAGEMENT</h1>

      <FormContainer>
        <Input
          type="text"
          placeholder="Enter block name"
          value={newBlock}
          onChange={(e) => setNewBlock(e.target.value)}
        />
        <AddButton onClick={handleAdd}>Add Block</AddButton>
      </FormContainer>

      <ItemTable>
        <thead>
          <tr>
            <th>ID</th>
            <th>Block Name</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {blocks.map((block) => (
            <tr key={block.block_id}>
              <td>{block.block_id}</td>
              <td>
                {editId === block.block_id ? (
                  <EditInput
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                  />
                ) : (
                  block.block_name
                )}
              </td>
              <td>
                {editId === block.block_id ? (
                  <>
                    <ActionButton
                      className="edit"
                      onClick={() => handleUpdate(block.block_id)}
                    >
                      Save
                    </ActionButton>
                    <ActionButton
                      onClick={() => {
                        setEditId(null);
                        setEditName("");
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
                        setEditId(block.block_id);
                        setEditName(block.block_name);
                      }}
                    >
                      Edit
                    </ActionButton>
                    <ActionButton
                      className="delete"
                      onClick={() => handleDelete(block.block_id)}
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

export default Blocks;
