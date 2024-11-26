// ProductsRoute.jsx

import React from "react";
import { Route, Routes } from "react-router-dom";
import AllProducts from "./AllProducts";
import AddProduct from "./AddProduct";
import OptionBar from "../shared/OptionBar";
import UpdateProduct from "./UpdateProduct";

import "./ProductsRoute.css";

function ProductsRoute() {
    return (
        <div className="productsroute">
            <OptionBar base={"Products"} options={["All", "Add"]} />
            <Routes>
                <Route path="/" exact element={<AllProducts />} />
                <Route path="/Add" exact element={<AddProduct />} />
                <Route path="/Update/:id" exact element={<UpdateProduct />} />
            </Routes>
        </div>
    );
}

export default ProductsRoute;
