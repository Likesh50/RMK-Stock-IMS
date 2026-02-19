import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import axios from 'axios';
import { HashLoader } from 'react-spinners';
import { Autocomplete, TextField, Button as MuiButton } from '@mui/material';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Logo from '../assets/Logo.png';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button
} from '@mui/material';
import dayjs from 'dayjs';

/* 🔹 REQUIRED FOR PRINT + EXCEL */
import ReactToPrint from 'react-to-print';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

/* === Styled components (visual upgrades) === */
const PageWrap = styled.div`
  min-height: 100vh;
  background: #f6f8f9;
  font-family: 'Inter', 'Helvetica Neue', Arial, sans-serif;
  padding-bottom: 40px;
`;

const TopBar = styled.div`
  background: #123b4b; /* darker teal */
  padding: 10px 20px;
  display: flex;
  align-items: center;
  gap: 14px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.08);
`;

const LogoImg = styled.img`
  height: 40px;
  width: auto;
`;

const Title = styled.h1`
  margin: 18px 0 8px;
  color: #0f4757;
  text-align: center;
  font-size: 36px;
  font-weight: 700;
  letter-spacing: -0.5px;
`;

const SubHeader = styled.div`
  text-align: center;
  color: #164863;
  font-weight: 600;
  display:flex;
  gap:20px;
  justify-content:center;
  margin-bottom: 12px;

  & > div { font-size: 16px; }
`;

const ControlsCard = styled.div`
  max-width: 980px;
  margin: 18px auto;
  background: #ffffff;
  padding: 16px;
  border-radius: 12px;
  box-shadow: 0 6px 20px rgba(6, 24, 38, 0.06);
  display:flex;
  gap: 12px;
  align-items:center;
  justify-content:center;
  flex-wrap:wrap;
`;

const Controls = styled.div`
  display:flex;
  gap:12px;
  align-items:center;
  justify-content:center;
  width:100%;
`;

const StyledAutocomplete = styled(Autocomplete)`
  & .MuiInputBase-root {
    border-radius: 8px;
    background: #fbfdff;
    padding-right: 6px;
  }
  & .MuiOutlinedInput-notchedOutline {
    border-color: #e2e8ea;
  }
  & .Mui-focused .MuiOutlinedInput-notchedOutline {
    border-color: #164863;
    box-shadow: 0 0 0 4px rgba(22,72,99,0.06);
  }
`;

const RefreshButton = styled(MuiButton)`
  && {
    background-color: #3582ab;;
    color: white;
    height: 42px;
    padding: 8px 18px;
    border-radius: 8px;
    box-shadow: 0 6px 14px rgba(22,72,99,0.18);
    text-transform: none;
    font-weight: 700;
  }
  &&:hover {
    background-color: #0f3e53;
  }
`;

const Container = styled.div`
  max-width: 1180px;
  margin: 0 auto;
  padding: 8px 18px 32px;
`;

const ItemTableWrap = styled.div`
  max-width: 1180px;
  margin: 8px auto 0;
  background: white;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 6px 16px rgba(6,24,38,0.06);
`;

const ItemTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 15px;
  table-layout: fixed;

  thead th {
    background: linear-gradient(180deg,#164863,#123b4b);
    color: white;
    font-weight: 800;
    padding: 14px 18px;
    text-align: left;
    position: sticky;
    top: 0;
  }

  th, td {
    padding: 14px 18px;
    border-bottom: 1px solid #f0f2f3;
    vertical-align: middle;
  }

  tbody tr:nth-child(even) td {
    background: #fbfcfd;
  }

  tbody tr:hover td {
    background: #f3fbff;
  }

  td.left { text-align: left; }
  td.center { text-align: center; }
  td.right { text-align: right; }

  /* Responsive tweaks */
  @media (max-width: 880px) {
    thead th:nth-child(1), td:nth-child(1) { width: 48px; padding-left:12px; }
    thead th, td { padding: 10px 12px; font-size: 14px; }
  }
`;

/* footer total row style */
const FooterRow = styled.tr`
  td {
    font-weight: 800;
    background: #fcfdfe;
    padding-top: 18px;
    padding-bottom: 18px;
  }
`;

const EmptyState = styled.div`
  padding: 28px;
  text-align: center;
  color: #556;
`;

/* loader overlay */
const LoaderOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(255,255,255,0.75);
  display:flex;
  align-items:center;
  justify-content:center;
  z-index: 999;
`;
const ButtonBar = styled.div`
  display: flex;
  justify-content: center;
  gap: 16px;
  margin: 10px 0;

  @media print {
    display: none;
  }
`;
const PrintButton = styled.button`
  background-color: #4CAF50; /* Green */
  border: none;
  color: white;
  padding: 10px 18px;
  border-radius: 6px;
  cursor: pointer;
`;

const ExportButton = styled.button`
  background-color: #2196F3; /* Blue */
  border: none;
  color: white;
  padding: 10px 18px;
  border-radius: 6px;
  cursor: pointer;
`;


/* END styled components */


/* === Component === */

export const ProductStock = () => {
  const [categories, setCategories] = useState([]); // strings
  const [itemsByCategory, setItemsByCategory] = useState([]); // { label, value }
  const [selectedCategory, setSelectedCategory] = useState(null); // string
  const [selectedItem, setSelectedItem] = useState(null); // {label, value}
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]); // stock rows from API
  const [showDialog, setShowDialog] = useState(false);
  const printRef = React.useRef(null);
  const [locationsFromSession, setLocationsFromSession] = useState([]);
  const selectedLocationId = localStorage.getItem('locationid') || '';
  const selectedLocationName = (locationsFromSession.find(l => String(l.location_id) === String(selectedLocationId)) || {}).location_name || '';

  useEffect(() => {
    // load categories
    const fetchCategories = async () => {
      try {
        const resp = await axios.get(`${import.meta.env.VITE_RMK_MESS_URL}/purchase/subcategories`);
        if (Array.isArray(resp.data)) {
          const uniq = Array.from(new Set(resp.data.map(i => (i.sub_category || '').trim()).filter(Boolean)));
          setCategories(uniq);
        } else {
          setCategories([]);
        }
      } catch (err) {
        console.error('Error fetching categories', err);
        toast.error('Failed to fetch categories');
      }
    };
    const stored = sessionStorage.getItem('userlocations');
    if (stored) {
      try { setLocationsFromSession(JSON.parse(stored)); } catch(e){/*ignore*/ }
    }
    fetchCategories();
  }, []);

  useEffect(() => {
    if (!selectedCategory) {
      setItemsByCategory([]);
      setSelectedItem(null);
      return;
    }

    const fetchItems = async () => {
      setLoading(true);
      try {
        const resp = await axios.get(`${import.meta.env.VITE_RMK_MESS_URL}/purchase/getItemsBySubcategory`, {
          params: { subcategory: selectedCategory }
        });
        if (Array.isArray(resp.data)) {
          const opts = resp.data.map(it => ({ label: it.item_name, value: it.item_id }));
          setItemsByCategory(opts);
        } else {
          setItemsByCategory([]);
        }
      } catch (err) {
        console.error('Error fetching items for category', err);
        toast.error('Failed to fetch items for category');
        setItemsByCategory([]);
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, [selectedCategory]);

  const fetchStockForItem = async (itemId) => {
    if (!itemId) return;
    setLoading(true);
    try {
      const resp = await axios.get(`${import.meta.env.VITE_RMK_MESS_URL}/report/productStock`, {
        params: { product_id: itemId }
      });
      const payload = resp.data?.data ?? resp.data ?? [];
      const normalized = Array.isArray(payload) ? payload.map(r => ({
        location_id: r.location_id,
        location_name: r.location_name,
        quantity: Number(r.quantity) || 0
      })) : [];
      setRows(normalized);
    } catch (err) {
      console.error('Error fetching stock', err);
      toast.error('Failed to fetch stock for selected item');
      setRows([]);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    if (selectedItem && selectedItem.value) {
      fetchStockForItem(selectedItem.value);
    } else {
      setRows([]);
    }
  }, [selectedItem]);

  const exportExcel = () => {
    const table = printRef.current.querySelector('table');
    if (!table) {
      toast.error('No data to export');
      return;
    }
    const ws = XLSX.utils.table_to_sheet(table);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Product Stock');
    const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([buf]), 'ProductStock.xlsx');
  };

  const grandTotal = rows.reduce((s, r) => s + (Number(r.quantity) || 0), 0);

  return (
    <PageWrap ref={printRef}>

      <Container>
        <Title>Stock Across Locations</Title>

        <SubHeader>
          <div>Report Date: <span style={{fontWeight:700, marginLeft:8}}>{dayjs().format('DD/MM/YYYY')}</span></div>
        </SubHeader>

        <ButtonBar>
          <ReactToPrint
            trigger={() => <PrintButton>Print Product Stock</PrintButton>}
            content={() => printRef.current}
          />
          <ExportButton onClick={exportExcel}>Export to Excel</ExportButton>
        </ButtonBar>


        <ControlsCard>
          <Controls>
            <StyledAutocomplete
              sx={{ width: 280 }}
              freeSolo
              options={categories}
              value={selectedCategory}
              onChange={(e, newVal) => setSelectedCategory(newVal || null)}
              renderInput={(params) => <TextField {...params} label="Category / Subcategory" size="small" />}
            />

            <StyledAutocomplete
              sx={{ width: 380 }}
              options={itemsByCategory}
              getOptionLabel={(opt) => opt?.label || ''}
              isOptionEqualToValue={(opt, val) => opt?.value === val?.value}
              value={selectedItem}
              onChange={(e, newVal) => setSelectedItem(newVal)}
              renderInput={(params) => <TextField {...params} label="Item" size="small" />}
              disabled={!selectedCategory || itemsByCategory.length === 0}
            />

            <RefreshButton
              variant="contained"
              onClick={() => {
                if (!selectedItem) {
                  toast.error('Please select an item to fetch stock');
                  return;
                }
                fetchStockForItem(selectedItem.value);
              }}
            >
              REFRESH
            </RefreshButton>
          </Controls>
        </ControlsCard>

        <ItemTableWrap>
          <ItemTable>
            <thead>
              <tr>
                <th style={{ width: 64 }}>SNo</th>
                <th>Location</th>
                <th style={{ width: 160, textAlign: 'right' }}>Quantity</th>
              </tr>
            </thead>

            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan="3">
                    <EmptyState>
                      {selectedItem ? 'No stock records found for this item.' : 'Select a category and item to view stock.'}
                    </EmptyState>
                  </td>
                </tr>
              ) : (
                rows.map((r, idx) => (
                  <tr key={r.location_id}>
                    <td className="center">{idx + 1}</td>
                    <td className="left">{r.location_name || `Location ${r.location_id}`}</td>
                    <td className="right">{Number(r.quantity).toLocaleString()}</td>
                  </tr>
                ))
              )}

              {rows.length > 0 && (
                <FooterRow>
                  <td colSpan={1} style={{ textAlign: 'left', paddingLeft: 18 }}>END OF REPORT</td>
                  <td style={{ textAlign: 'right', paddingRight: 16 }}>GRAND TOTAL</td>
                  <td style={{ textAlign: 'right', paddingRight: 18 }}>{grandTotal.toLocaleString()}</td>
                </FooterRow>
              )}
            </tbody>
          </ItemTable>
        </ItemTableWrap>

      </Container>

      <ToastContainer position="top-right" autoClose={3000} />

      <Dialog open={showDialog} onClose={() => setShowDialog(false)}>
        <DialogTitle>Confirm</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Do you want to continue with selected location <strong>{selectedLocationName}</strong>?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDialog(false)} color="secondary">Cancel</Button>
          <Button onClick={() => setShowDialog(false)} variant="contained" color="primary">OK</Button>
        </DialogActions>
      </Dialog>

      {loading && (
        <LoaderOverlay>
          <HashLoader color="#164863" loading={loading} size={84} />
        </LoaderOverlay>
      )}
    </PageWrap>
  );
};

export default ProductStock;
