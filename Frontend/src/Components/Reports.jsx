import React, { useState } from 'react';
import { DemoContainer } from '@mui/x-date-pickers/internals/demo';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const ReportsContainer = styled.div`
  padding: 0px 20px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const ReportsHeader = styled.h1`
  margin-bottom: 10px;
  color: #164863;
  margin-top: 0px;
`;

const ReportsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 30px;
  width: 100%;
  max-width: 1000px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

// Container for inverted triangle layout with Transfer below
const InvertedTriangleContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-width: 1000px;
`;

// Top row with Purchase and Dispatch side by side
const TopRow = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 30px;
  width: 100%;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

// Centered Transfer card container below
const TransferRow = styled.div`
  margin-top: 30px;
  width: 500px;
`;

const ReportCardContainer = styled.div`
  background-color: #ffffff;
  padding: 30px;
  border-radius: 10px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const ReportCardTitle = styled.h2`
  margin-bottom: 20px;
  color: #164863;
  font-size: 1.5rem;
  font-weight: 600;
`;

const DatePickerContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  margin-bottom: 20px;

  .MuiFormControl-root {
    margin-bottom: 15px;
  }
`;

const FetchButton = styled.button`
  background-color: #4CAF50;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 500;
  transition: background-color 0.3s ease;

  &:hover {
    background-color: #45a049;
  }
`;

const ReportCard = ({ title, route, fromDate, toDate, setFromDate, setToDate }) => {
  const navigate = useNavigate();

  const handleFetch = () => {
    if (!fromDate || !toDate) {
      toast.error('Please select both From and To dates.');
      return;
    }
    const formattedFromDate = dayjs(fromDate).format('YYYY-MM-DD');
    const formattedToDate = dayjs(toDate).format('YYYY-MM-DD');
    navigate(route, { state: { fromDate: formattedFromDate, toDate: formattedToDate } });
  };

  return (
    <ReportCardContainer>
      <ReportCardTitle>{title}</ReportCardTitle>
      <DatePickerContainer>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <DemoContainer components={['DatePicker']}>
            <DatePicker
              label="From"
              value={fromDate}
              onChange={(newValue) => setFromDate(newValue)}
            />
            <DatePicker
              label="To"
              value={toDate}
              onChange={(newValue) => setToDate(newValue)}
            />
          </DemoContainer>
        </LocalizationProvider>
      </DatePickerContainer>
      <FetchButton onClick={handleFetch}>Fetch</FetchButton>
    </ReportCardContainer>
  );
};

const Reports = () => {
  // Three separate pairs of state for each card!
  const [purchaseFromDate, setPurchaseFromDate] = useState(null);
  const [purchaseToDate, setPurchaseToDate] = useState(null);

  const [dispatchFromDate, setDispatchFromDate] = useState(null);
  const [dispatchToDate, setDispatchToDate] = useState(null);

  const [transferFromDate, setTransferFromDate] = useState(null);
  const [transferToDate, setTransferToDate] = useState(null);

  return (
    <>
      <ReportsContainer>
        <ReportsHeader>REPORTS</ReportsHeader>
        <InvertedTriangleContainer>
          <TopRow>
            <ReportCard
              title="PURCHASE"
              route="/dashboard/reports/purchase-report"
              fromDate={purchaseFromDate}
              toDate={purchaseToDate}
              setFromDate={setPurchaseFromDate}
              setToDate={setPurchaseToDate}
            />
            <ReportCard
              title="DISPATCH"
              route="/dashboard/reports/dispatch-report"
              fromDate={dispatchFromDate}
              toDate={dispatchToDate}
              setFromDate={setDispatchFromDate}
              setToDate={setDispatchToDate}
            />
          </TopRow>
          <TransferRow>
            <ReportCard
              title="TRANSFER"
              route="/dashboard/reports/transfer-report"
              fromDate={transferFromDate}
              toDate={transferToDate}
              setFromDate={setTransferFromDate}
              setToDate={setTransferToDate}
            />
          </TransferRow>
        </InvertedTriangleContainer>
      </ReportsContainer>
      <ToastContainer />
    </>
  );
};


export default Reports;