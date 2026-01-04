import React, { useRef, useState, useEffect } from 'react';
import ReactToPrint from 'react-to-print';
import styled from 'styled-components';
import ProductStock from './ProductStock';

const Page = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const ButtonBar = styled.div`
  display: flex;
  justify-content: center;
  gap: 20px;
  padding: 16px;

  @media print {
    display: none;
  }
`;

/* ✅ MATCHING AVAILABLE STOCK STYLES */
const PrintButton = styled.button`
  background-color: #4CAF50; /* green */
  border: none;
  color: white;
  padding: 12px 22px;
  font-size: 15px;
  cursor: pointer;
  border-radius: 8px;

  &:disabled {
    background-color: #9e9e9e;
    cursor: not-allowed;
  }
`;

const ExportButton = styled.button`
  background-color: #2196F3; /* blue */
  border: none;
  color: white;
  padding: 12px 22px;
  font-size: 15px;
  cursor: pointer;
  border-radius: 8px;
`;

const PrintArea = styled.div`
  width: 100%;
`;

const PrintProductStock = () => {
  const printRef = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (printRef.current) {
        setReady(true);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const pageStyle = `
    @page { margin: 12mm; }
    @media print {
      body {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
    }
  `;

  return (
    <Page>
      <ButtonBar>
        <ReactToPrint
          trigger={() => (
            <PrintButton disabled={!ready}>
              Print Item Stock
            </PrintButton>
          )}
          content={() => printRef.current}
          pageStyle={pageStyle}
        />

        {/* Optional future use */}
        {/* <ExportButton>Export to Excel</ExportButton> */}
      </ButtonBar>

      <PrintArea ref={printRef}>
        <ProductStock />
      </PrintArea>
    </Page>
  );
};

export default PrintProductStock;
