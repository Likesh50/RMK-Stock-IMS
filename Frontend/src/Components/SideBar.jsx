import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import purchase from '../assets/purchase.png';
import dispatch from '../assets/dispatch.png';
import Available from '../assets/Available.png';
import reports from '../assets/reports.png';
import add from '../assets/add.png';
import menu from '../assets/menu.png';
import order from '../assets/orderitem.png';
import expiry from "../assets/expiry.png";
import editdispatch from "../assets/edit-dispatch.png";
import editpurchase from "../assets/edit-purchase.png";
import view from '../assets/view.png';
import dashboard from '../assets/dashboard.png';
import pen from '../assets/pen.png';
const SidebarContainer = styled.div`
  background-color: white;
  min-height: 100vh; 
  width: 85px;
  display: flex;
  flex-direction: column;
  margin-top: 70px;
  left: 0;
  z-index: 10;
  transition: left 0.3s ease-in-out;
  padding-top: 20px;
  overflow-y: auto;
`;

const SidebarList = styled.ul`
  list-style: none;
  padding: 0px;
`;

const SidebarItem = styled.li`
  margin-bottom: 10px;

  &.active a {
    background-color: #D0E8F0;
  }

  a {
    font-size: 16px;
    text-align: center;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    padding: 10px 5px;
    border-radius: 5px;
    text-decoration: none;
    color: black;
    font-weight: 200;
    transition: background-color 0.3s ease-in-out;

    &:hover {
      background-color: #D0E8F0;
    }
  }

  a img {
    margin-bottom: 5px;
  }
`;

const SideBar = () => {
  const location = useLocation();
  const isActive = (path) => location.pathname === path ? 'active' : '';
  const role=window.sessionStorage.getItem("role");
  console.log(role);
  return (
    <SidebarContainer>
      <SidebarList>
        {role!=="Viewer" && (<SidebarItem className={isActive('/dashboard/purchase')}>
          <Link to="./purchase">
            <img src={purchase} width="40px" height="40px" alt="Purchase" />
            Purchase
          </Link>
        </SidebarItem>)}
        {role!=="Viewer" && (<SidebarItem className={isActive('/dashboard/dispatch')}>
          <Link to="./dispatch">
            <img src={dispatch} width="60px" height="40px" alt="Dispatch" />
            Dispatch
          </Link>
        </SidebarItem>)}
        <SidebarItem className={isActive('/dashboard/available')}>
          <Link to="available">
            <img src={Available} width="40px" height="40px" alt="Available Stock" />
            Available Stock
          </Link>
        </SidebarItem>
        <SidebarItem className={isActive('/dashboard/reports')}>
          <Link to="reports">
            <img src={reports} width="40px" height="40px" alt="Reports" />
            Reports
          </Link>
        </SidebarItem>
        {role!=="Viewer" && (<SidebarItem className={isActive('/dashboard/add')}>
          <Link to="add">
            <img src={add} width="40px" height="40px" alt="Add Items" />
            Add Items
          </Link>
        </SidebarItem>)}

        <SidebarItem className={isActive('/dashboard/ordertoplace')}>
          <Link to="ordertoplace">
            <img src={order} width="40px" height="40px" alt="Reports" />
            Items To Order
          </Link>
        </SidebarItem>

        <SidebarItem className={isActive('/dashboard/expiry')}>
          <Link to="expiry">
            <img src={expiry} width="40px" height="40px" alt="Reports" />
            Expiring Items
          </Link>
        </SidebarItem>

        {role!=="Viewer" && (<SidebarItem className={isActive('/dashboard/updateitem')}>
          <Link to="./updateitem">
            <img src={pen} width="50px" height="40px" alt="updateitem" />
            Edit item
          </Link>
        </SidebarItem>)}
        
        <SidebarItem className={isActive('/dashboard/editpurchase')}>
          <Link to="editpurchase">
            <img src={editpurchase} width="40px" height="40px" alt="Reports" />
            Edit Purchase
          </Link>
        </SidebarItem>
        <SidebarItem className={isActive('/dashboard/editdispatch')}>
          <Link to="editdispatch">
            <img src={editdispatch} width="40px" height="40px" alt="Reports" />
            Edit Dispatch
          </Link>
        </SidebarItem>
        
        {role==="Admin" &&  (<SidebarItem className={isActive('/adminsignup')}>
          <Link to="/adminsignup">
            <img src={menu} width="40px" height="40px" alt="Add Event menu" />
            Create users
          </Link>
        </SidebarItem>)}
      </SidebarList>
    </SidebarContainer>
  );
}

export default SideBar;
