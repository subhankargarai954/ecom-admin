// ProductCard.jsx

import React from "react";
import { Link } from "react-router-dom";
import axios from "axios";

import "./ProductCard.css";

export default function ProductCard({ product, onDelete }) {

    const ADMIN_API_PRODUCTS = process.env.REACT_APP_ADMIN_API_PRODUCTS;

    const deleteProduct = async (product) => {
        try {
            const response = await axios.delete(
                `${ADMIN_API_PRODUCTS}/${product.id}`
            );
            if (response.data && onDelete) {
                onDelete(product.id);
            }
        } catch (error) {
            console.error(`deleteProduct error: ${error.message}`);
        }
    };

    return (
        <div className="product">
            <div className="product-inner">
                <div className="product-inner-upper">
                    <div className="product-inner-upper-img">
                        <img src={product.image} alt="" />
                    </div>
                    <div className="product-inner-upper-name">
                        <h5>Product Name</h5>
                        {product.name}
                    </div>
                    <div className="product-inner-upper-price">
                        <h5>Price</h5>
                        <span>
                            <sup>₹</sup>
                            {product.price}
                        </span>
                    </div>
                    <div className="product-inner-upper-category">
                        <h5>Category</h5>
                        {product.categoryName}
                    </div>
                    <div className="product-inner-upper-details">
                        <h5>Details</h5>
                        <div className="product-inner-upper-details-body">
                            {product.more_info}
                        </div>
                        {/* {product.more_info.length > 20
                            ? `${product.more_info.slice(0, 20)} . . . `
                            : product.more_info} */}
                    </div>
                    <div className="product-inner-otherImages">
                        {/* <h5 className="product-inner-otherImages-text">
                            Other images
                        </h5> */}
                        <h5>
                            {product.secondaryImages.length
                                ? "Other Images"
                                : null}
                        </h5>
                        <div className="product-inner-otherImages-images-div">
                            {/* {product.secondaryImages.slice(0, 3).map(
                                (
                                    image,
                                    index // Show only the first 4 images
                                ) => (
                                    <img
                                        className="product-inner-otherImages-images"
                                        key={index}
                                        src={image.image_url}
                                        alt=""
                                    />
                                )
                            )}
                            {product.secondaryImages.length > 3 && (
                                <span>
                                    + {product.secondaryImages.length - 3} more
                                </span>
                            )} */}

                            {product.secondaryImages.map((image, index) => {
                                return (
                                    <img
                                        className="product-inner-otherImages-images"
                                        key={index}
                                        src={image.image_url}
                                        alt=""
                                    />
                                );
                            })}
                        </div>
                    </div>
                    <div className="product-inner-upper-switch">
                        <Link
                            to={`Update/${product.id}`}
                            state={{ product }}
                            className="Link"
                        >
                            <div className="product-inner-upper-switch-edit">
                                Edit
                            </div>
                        </Link>

                        {/* <Link to={""} className="Link"> */}
                        <div
                            className="product-inner-upper-switch-delete"
                            onClick={() => deleteProduct(product)}
                        >
                            Delete
                        </div>
                        {/* </Link> */}
                    </div>
                </div>
            </div>
        </div>
    );
}
