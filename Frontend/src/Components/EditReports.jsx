import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import Reports from './Reports';
import PrintPurchaseReport from './PrintPurchaseReport';
import PrintDispatchReport from './PrintDispatchReport';
import PrintTransferReport from './PrintTransferReport';
import PrintNetReport from './PrintNetReport';

const EditReports = () => {
  if (window.sessionStorage.getItem('uname') !== 'admin') return <Navigate to="/dashboard/reports" replace />;
  return <Routes>
    <Route index element={<Reports editMode />} />
    <Route path="purchase-report" element={<PrintPurchaseReport />} />
    <Route path="dispatch-report" element={<PrintDispatchReport />} />
    <Route path="transfer-report" element={<PrintTransferReport />} />
    <Route path="net-report" element={<PrintNetReport />} />
  </Routes>;
};
export default EditReports;
