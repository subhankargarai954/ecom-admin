import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";

import "./App.css";

import NavigationBar from "./components/NavigationBar";
import Home from "./components/Home";
import AllCategories from "./components/Categories/AllCategories";
import AllUsers from "./components/Users/AllUsers";
import ProductsRoute from "./components/Products/ProductsRoute";

function App() {
    return (
        <BrowserRouter>
            <div className="App">
                <NavigationBar
                    list1={["Products", "Categories", "Users"]}
                    list2={["Admin-Login"]}
                ></NavigationBar>
                <Routes>
                    <Route path="/" exact element={<Home />} />
                    <Route
                        path="/Products/*"
                        exact
                        element={<ProductsRoute />}
                    />
                    <Route
                        path="/Categories"
                        exact
                        element={<AllCategories />}
                    />
                    <Route path="/Users/*" exact element={<AllUsers />} />
                </Routes>
            </div>
        </BrowserRouter>
    );
}

export default App;
