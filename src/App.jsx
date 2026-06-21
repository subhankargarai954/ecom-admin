import React from "react";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import "./App.css";

import Login from "./components/Login";
import AdminLayout from "./components/AdminLayout";
import Dashboard from "./components/Dashboard/Dashboard";
import AllProducts from "./components/Products/AllProducts";
import ProductForm from "./components/Products/ProductForm";
import AllCategories from "./components/Categories/AllCategories";
import AllOrders from "./components/Orders/AllOrders";
import OrderDetail from "./components/Orders/OrderDetail";
import PendingDues from "./components/PendingDues/PendingDues";
import AllUsers from "./components/Users/AllUsers";

function PrivateRoute({ children }) {
    const token = localStorage.getItem("adminToken");
    return token ? children : <Navigate to="/login" replace />;
}

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/*" element={
                    <PrivateRoute>
                        <AdminLayout>
                            <Routes>
                                <Route path="/" element={<Dashboard />} />
                                <Route path="/products" element={<AllProducts />} />
                                <Route path="/products/new" element={<ProductForm />} />
                                <Route path="/products/:id/edit" element={<ProductForm />} />
                                <Route path="/categories" element={<AllCategories />} />
                                <Route path="/orders" element={<AllOrders />} />
                                <Route path="/orders/:id" element={<OrderDetail />} />
                                <Route path="/pending-dues" element={<PendingDues />} />
                                <Route path="/users" element={<AllUsers />} />
                            </Routes>
                        </AdminLayout>
                    </PrivateRoute>
                } />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
