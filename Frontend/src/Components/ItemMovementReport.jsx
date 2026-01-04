import React, { useState, useEffect, forwardRef } from 'react';
import styled from 'styled-components';
import axios from 'axios';
import { HashLoader } from 'react-spinners';
import { Autocomplete, TextField, Button as MuiButton } from '@mui/material';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Logo from '../assets/Logo.png';
import dayjs from 'dayjs';

/* Theme color used for footer + header */
const THEME_COLOR = '#164863';

/* === Styled components === */
const PageWrap = styled.div`
  min-height: 100vh;
  background: #f6f8f9;
  font-family: 'Inter', 'Helvetica Neue', Arial, sans-serif;
  padding-bottom: 40px;

  @media print {
    background: white;
    padding: 0;
  }
`;

const Container = styled.div`
  max-width: 1180px;
  margin: 0 auto;
  padding: 8px 18px 32px;

  @media print {
    max-width: 100%;
    margin: 0;
    padding: 8px;
  }
`;

const TopBar = styled.div`
  background: #123b4b;
  padding: 10px 20px;
  display:flex;
  align-items:center;
  gap:14px;
`;
const LogoImg = styled.img` height: 40px; width: auto; `;

const Title = styled.h1`
  margin: 18px 0 6px;
  color: #0f4757;
  text-align: center;
  font-size: 28px;
  font-weight: 700;

  @media print {
    font-size: 22px;
    margin: 12px 0;
  }
`;

/* Print-only large header (logo + INVENTORY MANAGEMENT SYSTEM) */
const PrintHeader = styled.div`
  display: none;
  text-align: center;
  margin-bottom: 10px;

  img { width: 150px; height: auto; margin-bottom: 6px; }
  h1 { font-size: 24px; margin: 0; color: ${THEME_COLOR}; }

  @media print { display: block; }
`;

/* Top meta header (on-screen) / MetaInfo (print + screen) */
const MetaInfo = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 40px;
  margin: 12px 0 12px 0;
  color: ${THEME_COLOR};
  text-align: left;

  div {
    display: flex;
    flex-direction: column;
    min-width: 140px;
  }

  .meta-label {
    font-weight: 800;
    font-size: 13px;
    color: ${THEME_COLOR};
  }

  .meta-value {
    font-weight: 700;
    font-size: 14px;
  }

  @media print {
    gap: 10px;
    margin: 8px 0 8px 0;
    .meta-label, .meta-value { font-size: 18px; }
  }
`;

/* Controls (hidden in print) */
const ControlsCard = styled.div`
  max-width: 980px;
  margin: 12px auto 18px;
  background: #ffffff;
  padding: 12px;
  border-radius: 10px;
  box-shadow: 0 6px 20px rgba(6,24,38,0.06);
  display:flex;
  gap: 12px;
  align-items:center;
  justify-content:center;
  flex-wrap:wrap;

  @media print {
    display:none;
  }
`;

const StyledAutocomplete = styled(Autocomplete)`
  & .MuiInputBase-root { border-radius: 8px; background: #fbfdff; }
  & .MuiOutlinedInput-notchedOutline { border-color: #e2e8ea; }
  & .Mui-focused .MuiOutlinedInput-notchedOutline { border-color: ${THEME_COLOR}; }
`;

const DateInput = styled.input`
  padding: 8px 10px;
  border-radius: 8px;
  border: 1px solid #e2e8ea;
  background: #fafcff;
  height: 40px;
`;

const RefreshButton = styled(MuiButton)`
  && { background-color: ${THEME_COLOR}; color: white; border-radius: 8px; font-weight:700; height:42px; }
  &&:hover { background-color: #0f3e53; }
`;

/* Table */
const ItemTableWrap = styled.div`
  max-width: 1180px;
  margin: 8px auto 18px;
  background: white;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 6px 16px rgba(6,24,38,0.06);

  @media print {
    box-shadow: none;
    border-radius: 0;
    margin: 0;
  }
`;

const ItemTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 15px;
  table-layout: fixed;

  /* Use THEME_COLOR for header so it matches Footer */
  > thead > tr > th {
    background: ${THEME_COLOR};
    color: #ffffff;
    font-weight: 700;
    padding: 12px 16px;
    text-align: left;
  }

  th, td { padding: 12px 16px; border-bottom: 1px solid #f0f2f3; vertical-align: middle; }
  tbody tr:nth-child(even) td { background: #fbfcfd; }
  tbody tr:hover td { background: #f3fbff; }

  td.left { text-align: left; }
  td.center { text-align: center; }
  td.right { text-align: right; }

  @media print {
    /* keep theme color for print and ensure it prints */
    > thead > tr > th { background: ${THEME_COLOR}; color: #fff; -webkit-print-color-adjust: exact; }
    tbody tr:nth-child(even) td { background: transparent; }
    tbody tr:hover td { background: transparent; }
    th, td { padding: 8px; font-size: 12px; }
  }
`;

/* colored rows (on-screen only tint; print will not show heavy color) */
const RowPurchase = styled.tr` td { background: rgba(54, 162, 80, 0.06); }`;
const RowDispatch = styled.tr` td { background: rgba(220, 53, 69, 0.04); }`;
const RowTransferIn = styled.tr` td { background: rgba(54, 162, 235, 0.06); }`;
const RowTransferOut = styled.tr` td { background: rgba(220, 53, 69, 0.04); }`;

/* END OF REPORT banner - simpler and printable */
const EndBanner = styled.div`
  max-width: 1180px;
  margin: 18px auto 8px;
  display:flex;
  align-items:center;
`;
const EndBadge = styled.div`
  background: ${THEME_COLOR};
  color: #fff;
  font-weight: 800;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 13px;
  box-shadow: 0 6px 14px rgba(22,72,99,0.12);

  @media print {
    background: #000;
    -webkit-print-color-adjust: exact;
    box-shadow: none;
  }
`;

/* Printable final summary table (2 rows: labels + values) */
const FinalSummaryTable = styled.table`
  width: 100%;
  max-width: 1180px;
  margin: 12px auto 30px;
  border-collapse: collapse;
  background: #ffffff;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 6px 16px rgba(6,24,38,0.04);
  font-family: 'Inter', Arial, sans-serif;

  thead th {
    /* match header color */
    background: ${THEME_COLOR};
    color: #ffffff;
    padding: 14px 12px;
    font-weight: 700;
    font-size: 13px;
    text-align: center;
  }

  tbody td {
    padding: 14px 12px;
    border-bottom: 1px solid #eef2f3;
    text-align: center;
    vertical-align: middle;
    font-weight: 700;
    color: ${THEME_COLOR};
    font-size: 13px;
  }

  tbody tr.values td {
    font-size: 18px;
    font-weight: 900;
    color: #0f4757;
  }

  .money { font-family: 'Courier New', monospace; }

  .stock-col { background: rgba(22,72,99,0.03); }

  @media print {
    thead th { -webkit-print-color-adjust: exact; }
    box-shadow: none;
    border-radius: 0;
    color:white;
    thead th, tbody td { padding: 10px; font-size: 12px; color: white; }
    tbody tr.values td { font-size: 14px; font-weight: 800; }
  }
`;

/* Footer for print */
const Footer = styled.footer`
  text-align: center;
  padding: 10px;
  background-color: ${THEME_COLOR};
  color: white;
  display: none;
  margin-top: 12px;
  @media print { display: block; -webkit-print-color-adjust: exact; }
`;

/* Loader overlay */
const LoaderOverlay = styled.div` position: fixed; inset: 0; background: rgba(255,255,255,0.75); display:flex; align-items:center; justify-content:center; z-index:999; `;

/* helper formatting */
const fNum = n => (n == null ? '0' : Number(n).toLocaleString());
const fMoney = m => {
  if (m == null) return '0.00';
  const num = Number(m);
  if (Number.isNaN(num)) return '0.00';
  return num.toFixed(2);
};
const formatDate = (dateString) => {
  if (!dateString) return '';
  const d = dayjs(dateString);
  if (!d.isValid()) return dateString;
  return d.format('DD/MM/YYYY');
};

/* Institution name mapping (same as your other file) */
const institutionMap = {
  RMKEC: "R.M.K. Engineering College",
  RMD: "R.M.D. Engineering College",
  RMKCET: "R.M.K. College of Engg. & Technology",
  "RMK Residential school": "R.M.K. Residential School",
  "RMK Patashala": "R.M.K. Patashala"
};

/* === Component === */
/* Use forwardRef so parent can get DOM node for printing/export */
const ItemMovementReport = forwardRef(({ fromDate: propFromDate, toDate: propToDate }, ref) => {
  const [categories, setCategories] = useState([]);
  const [itemsByCategory, setItemsByCategory] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);

  const [fromDate, setFromDate] = useState(() => propFromDate || dayjs().startOf('month').format('YYYY-MM-DD'));
  const [toDate, setToDate] = useState(() => propToDate || dayjs().format('YYYY-MM-DD'));

  useEffect(() => {
    // if parent passes dates later, update local state
    if (propFromDate) setFromDate(propFromDate);
    if (propToDate) setToDate(propToDate);
  }, [propFromDate, propToDate]);

  const [locationsFromSession, setLocationsFromSession] = useState([]);
  useEffect(() => {
    const stored = sessionStorage.getItem('userlocations');
    if (stored) {
      try { setLocationsFromSession(JSON.parse(stored)); } catch(e) {}
    }
  }, []);
  const selectedLocationId = localStorage.getItem('locationid') || '';
  const selectedLocationName = (locationsFromSession.find(l => String(l.location_id) === String(selectedLocationId)) || {}).location_name || localStorage.getItem('locationname') || '';

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const resp = await axios.get(`${import.meta.env.VITE_RMK_MESS_URL}/purchase/subcategories`);
        if (Array.isArray(resp.data)) {
          const uniq = Array.from(new Set(resp.data.map(i => (i.sub_category || '').trim()).filter(Boolean)));
          setCategories(uniq);
        }
      } catch (err) {
        console.error('Error fetching categories', err);
        toast.error('Failed to load categories');
      }
    };
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
        const resp = await axios.get(`${import.meta.env.VITE_RMK_MESS_URL}/purchase/getItemsBySubcategory`, { params: { subcategory: selectedCategory } });
        if (Array.isArray(resp.data)) {
          setItemsByCategory(resp.data.map(it => ({ label: it.item_name, value: it.item_id, category: it.sub_category || '' })));
        } else {
          setItemsByCategory([]);
        }
      } catch (err) {
        console.error(err);
        toast.error('Failed to fetch items for category');
        setItemsByCategory([]);
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
  }, [selectedCategory]);

  const fetchMovement = async () => {
    if (!selectedItem || !selectedItem.value) {
      toast.error('Please select an item');
      return;
    }
    setLoading(true);
    try {
      const locationId = localStorage.getItem('locationid') || undefined;
      const resp = await axios.get(`${import.meta.env.VITE_RMK_MESS_URL}/report/itemMovement`, {
        params: {
          item_id: selectedItem.value,
          location_id: locationId,
          startDate: fromDate,
          endDate: toDate
        }
      });
      if (resp.data && resp.data.success) {
        setRows(resp.data.data || []);
        setSummary(resp.data.summary || null);
      } else {
        setRows([]);
        setSummary(null);
        toast.error('No data returned');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to fetch movements');
      setRows([]);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedItem && selectedItem.value) fetchMovement();
    else { setRows([]); setSummary(null); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedItem, fromDate, toDate]);

  const totalAmountInStock = summary ? Number((summary.totalPurchaseAmount || 0) - (summary.totalDispatchAmount || 0)).toFixed(2) : null;

  // Determine institution name (same logic as PurchaseReport)
  const locationnameKey = localStorage.getItem('locationname') || '';
  const institutionName = selectedLocationName || (institutionMap[locationnameKey] || locationnameKey);

  /* attach ref to top-level element so parent can print/export */
  return (
    <PageWrap ref={ref}>
      <Container>
        {/* Print-only header like your reference */}
        <PrintHeader>
          <img src={Logo} alt="Logo" />
          <h1>INVENTORY MANAGEMENT SYSTEM</h1>
        </PrintHeader>

        {/* Screen header */}
        <div style={{ textAlign: 'center', marginBottom: 8 }}>
          <Title>Stock Ledger</Title>
        </div>

        {/* Meta information */}
        <MetaInfo>
          <div>
            <span className="meta-label">Institution</span>
            <span className="meta-value">{institutionName || '—'}</span>
          </div>
          <div>
            <span className="meta-label">Report Date</span>
            <span className="meta-value">{formatDate(new Date().toISOString())}</span>
          </div>
          <div>
            <span className="meta-label">From</span>
            <span className="meta-value">{formatDate(fromDate)}</span>
          </div>
          <div>
            <span className="meta-label">To</span>
            <span className="meta-value">{formatDate(toDate)}</span>
          </div>
          <div>
            <span className="meta-label">Item</span>
            <span className="meta-value">{selectedItem?.label || 'All'}</span>
          </div>
          <div>
            <span className="meta-label">Category</span>
            <span className="meta-value">{selectedCategory || (selectedItem ? (selectedItem.category || '—') : 'All')}</span>
          </div>
        </MetaInfo>

        {/* Controls (hidden in print) */}
        <ControlsCard>
          <StyledAutocomplete
            sx={{ width: 260 }}
            freeSolo
            options={categories}
            value={selectedCategory}
            onChange={(e, v) => setSelectedCategory(v || null)}
            renderInput={(params) => <TextField {...params} label="Category / Subcategory" size="small" />}
          />

          <StyledAutocomplete
            sx={{ width: 360 }}
            options={itemsByCategory}
            getOptionLabel={(opt) => opt?.label || ''}
            isOptionEqualToValue={(a,b) => a?.value === b?.value}
            value={selectedItem}
            onChange={(e,v) => setSelectedItem(v)}
            renderInput={(params) => <TextField {...params} label="Item" size="small" />}
            disabled={!selectedCategory || itemsByCategory.length === 0}
          />

          <RefreshButton variant="contained" onClick={fetchMovement}>REFRESH</RefreshButton>
        </ControlsCard>

        {/* Table */}
        <ItemTableWrap>
          <ItemTable>
            <thead>
              <tr>
                <th style={{width:64}}>SNo</th>
                <th style={{minWidth:140}}>Date</th>
                <th style={{minWidth:220}}>Source</th>
                <th style={{width:120}}>Type</th>
                <th style={{width:100, textAlign:'right'}}>Qty</th>
                <th style={{width:120, textAlign:'right'}}>Price</th>
                <th style={{width:140, textAlign:'right'}}>Total</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{padding:20, textAlign:'center'}}>No records to show. Select an item and date range.</td>
                </tr>
              ) : rows.map((r, idx) => {
                const key = `${idx}-${r.date}-${r.source_type}-${r.location_id || ''}`;
                if (r.source_type === 'purchase') {
                  return (
                    <RowPurchase key={key}>
                      <td className="center">{idx+1}</td>
                      <td className="left">{formatDate(r.date)}</td>
                      <td className="left">{r.source_name || 'Purchase'}</td>
                      <td className="center">Purchase</td>
                      <td className="right">{fNum(r.quantity)}</td>
                      <td className="right">{fMoney(r.price)}</td>
                      <td className="right">{fMoney(r.total)}</td>
                    </RowPurchase>
                  );
                } else if (r.source_type === 'dispatch') {
                  return (
                    <RowDispatch key={key}>
                      <td className="center">{idx+1}</td>
                      <td className="left">{formatDate(r.date)}</td>
                      <td className="left">{r.source_name || 'Dispatch'}</td>
                      <td className="center">Dispatch</td>
                      <td className="right">{fNum(r.quantity)}</td>
                      <td className="right">{fMoney(r.price)}</td>
                      <td className="right">{fMoney(r.total)}</td>
                    </RowDispatch>
                  );
                } else if (r.source_type === 'transfer_in') {
                  return (
                    <RowTransferIn key={key}>
                      <td className="center">{idx+1}</td>
                      <td className="left">{formatDate(r.date)}</td>
                      <td className="left">{r.source_name || 'Transfer In'}</td>
                      <td className="center">Transfer In</td>
                      <td className="right">{fNum(r.quantity)}</td>
                      <td className="right">{fMoney(r.price)}</td>
                      <td className="right">{fMoney(r.total)}</td>
                    </RowTransferIn>
                  );
                } else if (r.source_type === 'transfer_out') {
                  return (
                    <RowTransferOut key={key}>
                      <td className="center">{idx+1}</td>
                      <td className="left">{formatDate(r.date)}</td>
                      <td className="left">{r.source_name || 'Transfer Out'}</td>
                      <td className="center">Transfer Out</td>
                      <td className="right">{fNum(r.quantity)}</td>
                      <td className="right">{fMoney(r.price)}</td>
                      <td className="right">{fMoney(r.total)}</td>
                    </RowTransferOut>
                  );
                } else {
                  return (
                    <tr key={key}>
                      <td className="center">{idx+1}</td>
                      <td className="left">{formatDate(r.date)}</td>
                      <td className="left">{r.source_name || ''}</td>
                      <td className="center">{r.source_type}</td>
                      <td className="right">{fNum(r.quantity)}</td>
                      <td className="right">{fMoney(r.price)}</td>
                      <td className="right">{fMoney(r.total)}</td>
                    </tr>
                  );
                }
              })}
            </tbody>
          </ItemTable>
        </ItemTableWrap>

        {/* End banner (subtle & printable) */}
        <EndBanner>
          <EndBadge>END OF REPORT</EndBadge>
        </EndBanner>

        {/* Final printable summary table */}
        {summary && (
          <FinalSummaryTable>
            <thead>
              <tr>
                <th>Purchased Qty</th>
                <th>Dispatched Qty</th>
                <th>Transferred In</th>
                <th>Transferred Out</th>
                <th>Available Qty</th>
                <th>Total Purchase Amount</th>
                <th>Total Dispatch Amount</th>
                <th >Total Amount in Stock (Purchase - Dispatch)</th>
              </tr>
            </thead>
            <tbody>
              <tr className="values">
                <td>{fNum(summary.purchaseQty)}</td>
                <td>{fNum(summary.dispatchQty)}</td>
                <td>{fNum(summary.transferInQty)}</td>
                <td>{fNum(summary.transferOutQty)}</td>
                <td>{fNum(summary.availableQty)}</td>
                <td className="money">{fMoney(summary.totalPurchaseAmount)}</td>
                <td className="money">{fMoney(summary.totalDispatchAmount)}</td>
                <td className="money">{fMoney(totalAmountInStock)}</td>
              </tr>
            </tbody>
          </FinalSummaryTable>
        )}

        {/* Print footer */}
        <Footer>
          Copyright © {new Date().getFullYear()}. All rights reserved to DEPARTMENT of INFORMATION TECHNOLOGY - RMKEC
        </Footer>
      </Container>

      <ToastContainer position="top-right" autoClose={3000} />

      {loading && (
        <LoaderOverlay>
          <HashLoader color={THEME_COLOR} loading={loading} size={84} />
        </LoaderOverlay>
      )}
    </PageWrap>
  );
});

export default ItemMovementReport;
