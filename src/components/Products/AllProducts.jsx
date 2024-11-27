// AllProducts.jsx

import React, { useEffect, useState } from "react";
import axios from "axios";

import ProductCard from "./ProductCard";

import "./AllProducts.css";

function AllProducts() {
    const ADMIN_API_PRODUCTS = process.env.REACT_APP_ADMIN_API_PRODUCTS;

    const [allProducts, setAllProducts] = useState([]);

    useEffect(() => {
        const getProducts = async () => {
            // console.log(`____________`);
            try {
                const response = await axios.get(`${ADMIN_API_PRODUCTS}`);
                let products = response.data.products;
                // products && console.dir(products, { depth: null });

                // integrate categoryName to product object
                try {
                    products = await Promise.all(
                        products &&
                            products.map(async (product) => {
                                const res = await axios.get(
                                    `${ADMIN_API_PRODUCTS}/category/${product.category_id}`
                                );
                                // res.data && console.log(res.data.name);
                                if (res.data)
                                    product.categoryName = res.data.name;
                                // console.dir(product, { depth: null });
                                return product;
                            })
                    );
                } catch (error) {
                    console.log(`2 getProducts: ${error}`);
                }

                // products && console.dir(products, { depth: null });

                // integrate secondary images of products to product object
                try {
                    products = await Promise.all(
                        products &&
                            products.map(async (product) => {
                                const res = await axios.get(
                                    `${ADMIN_API_PRODUCTS}/productimage/${product.id}`
                                );
                                // res.data && console.dir(res.data, { depth: null });
                                // if (res.data)
                                product.secondaryImages = res.data;
                                // console.dir(product, { depth: null });
                                return product;
                            })
                    );
                } catch (error) {
                    console.log(`3 getProducts: ${error}`);
                }

                console.dir(products, { depth: null });
                setAllProducts(products);
            } catch (error) {
                console.log(`1 getProducts: ${error}`);
            }
        };
        getProducts();
    }, []);

    return (
        <div className="allproducts">
            <div className="allproducts-product">
                {allProducts &&
                    allProducts.map((product, index) => {
                        return <ProductCard key={index} product={product} />;
                    })}
            </div>
        </div>
    );
}

export default AllProducts;
