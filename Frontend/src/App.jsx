import React, { useEffect } from "react";
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import LoginPage from './Components/LoginPage'
import Layout from "./Components/Layout";
import Dispatch from "./Components/Dispatch";
import Purchase from "./Components/Purchase.jsx";
import AvailableStock from "./Components/AvailableStock.jsx";
import Reports from "./Components/Reports.jsx";
import AddItems from "./Components/AddItems.jsx";
import DashBoard from "./Components/Dashboard.jsx";
import SignupPage from "./Components/SignUp.jsx";
import PrintPurchaseReport from "./Components/PrintPurchaseReport.jsx";
import PrintDispatchReport from "./Components/PrintDispatchReport.jsx";
import PrintTransferReport from "./Components/PrintTransferReport.jsx";
import ExpiryItems from "./Components/ExpiryItems.jsx";
import OrderToPlace from "./Components/OrderToPlace.jsx";
import UpdateItems from "./Components/UpdateItems.jsx";
import EditPurchase from "./Components/EditPurchase.jsx";
import EditDispatch from "./Components/EditDispatch.jsx";
import ItemsTable from "./Components/ItemTable.jsx";
import PrintPage from "./Components/PrintPage.jsx";
import Blocks from "./Components/Blocks.jsx";
import Shops from "./Components/Shops.jsx";
import Transfer from "./Components/Transfer.jsx";
import ProductStock from "./Components/ProductStock.jsx";
import PrintNetReport from "./Components/PrintNetReport.jsx";
import PrintAvailableStock from "./Components/PrintAvailableStock.jsx";
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

function App() {
  return (
    <div className='app'>
      <Router>
        <ScrollToTop />
        <Routes>
          <Route path='/' element={<LoginPage />} />
          <Route path='/adminsignUp' element={<SignupPage/>} />
          <Route path="/dashboard/*" element={<Layout />}>
            <Route index element={<Purchase/>} />
            <Route path="dispatch" element={<Dispatch />} />
            <Route path="Blocks" element={<Blocks/>} />
            <Route path="shops" element={<Shops/>} />
             <Route path="transfer" element={<Transfer/>} />
            <Route path="purchase" element={<Purchase/>} />
            <Route path="available" element={<PrintAvailableStock />} />
            <Route path="editpurchase" element={<EditPurchase />} />
            <Route path="reports" element={<Reports />} />
            <Route path="add" element={<AddItems />} />
            <Route path="expiry" element={<ExpiryItems />} />
            <Route path="ordertoplace" element={<OrderToPlace />} />
            <Route path="updateitem" element={<UpdateItems/>}/>
            <Route path="editdispatch" element={<EditDispatch/>}/>
            <Route path="itemtable" element={<ItemsTable/>}/>
            <Route path="itemtable/print" element={<PrintPage/>}/>
            <Route path="productStock" element={<ProductStock/>}/>
            <Route path="reports/dispatch-report" element={<PrintDispatchReport/>} />
            <Route path="reports/purchase-report" element={<PrintPurchaseReport/>} />
            <Route path="reports/transfer-report" element={<PrintTransferReport/>} />
            <Route path="reports/net-report" element={<PrintNetReport/>} />
          </Route>
        </Routes>
      </Router>
    </div>
  );
}

export default App;
