// UpdateProduct.jsx

import React, { useEffect, useState } from "react";
import axios from "axios";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import { ADMIN_API_PRODUCTS } from "../../CONFIDENTIAL/Confidential";

import "./UpdateProduct.css";

function UpdateProduct() {
    const navigate = useNavigate();
    const location = useLocation();

    const [productName, setProductName] = useState("");
    const [productImage, setProductImage] = useState("");
    const [productPrice, setProductPrice] = useState("");
    const [productCategoryName, setProductCategoryName] = useState("");
    const [productCategoryId, setProductCategoryId] = useState("");
    const [productDetails, setProductDetails] = useState("");
    const [otherImages, setOtherImages] = useState([]);

    const [categories, setCategories] = useState([]);

    const [successMessage, setSuccessMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [isValidImage, setIsValidImage] = useState(true);

    const { id } = useParams();
    // const productId = id;

    useEffect(() => {
        const product = location.state?.product;
        if (product) {
            setProductName(product.name);
            setProductImage(product.image);
            setProductPrice(product.price);
            setProductCategoryName(product.categoryName);
            setProductCategoryId(product.category_id);
            setProductDetails(product.more_info);
            const updatedImages = [];
            for (let i = 0; i < product.secondaryImages.length; i++) {
                updatedImages.push(product.secondaryImages[i].image_url);
            }
            setOtherImages(updatedImages);
        }
        console.dir(product, { depth: null });

        const getAllCategoryName = async () => {
            const response = await axios.get(`${ADMIN_API_PRODUCTS}/category`);
            setCategories(response.data.categories);
            // console.dir(categories, { depth: null });
        };
        getAllCategoryName();
    }, []);

    // useEffect(() => {
    //     console.dir(otherImages, { depth: null });
    // }, []);

    /////////////////////// API ///////////////////////////////
    const updateProduct = async () => {
        try {
            const response = await axios.post(`${ADMIN_API_PRODUCTS}/`, {
                prodId: id,
                prodName: productName,
                prodImage: productImage,
                prodPrice: productPrice,
                prodCategoryId: productCategoryId,
                prodDetails: productDetails,
            });

            if (response.data.product) {
                try {
                    const result = await axios.post(
                        `${ADMIN_API_PRODUCTS}/otherimages`,
                        {
                            images: otherImages,
                            productId: response.data.product.id,
                        }
                    );
                    if (result.data) {
                        setSuccessMessage("Successfully Updated");
                        setTimeout(() => {
                            navigate("/Products");
                        }, 3000);
                    }
                } catch (error) {
                    console.dir(error, { depth: null });
                    setErrorMessage(`${error}`);
                }
            } else if (response.data.error) {
                setErrorMessage(`${response.data.error}`);
            }
        } catch (error) {
            console.log(error);
            setErrorMessage("Product Not Updated");
        }

        setTimeout(() => {
            setSuccessMessage("");
            setErrorMessage("");
        }, 3000);
    };

    /////////////////////// Modify ////////////////////////////
    const handleImageChange = (e) => {
        const url = e.target.value;
        setProductImage(url);

        // Validating the url
        const img = new Image();
        img.src = url;
        img.onload = () => {
            // setProductImage(url);
            setIsValidImage(true);
        };
        img.onerror = () => {
            // setProductImage("");
            setIsValidImage(false);
        };
    };
    const handleImagesChange = (index, value) => {
        // console.dir(otherImages, { depth: null });
        const updatedImages = [...otherImages];
        updatedImages[index] = value;
        setOtherImages(updatedImages);
        // console.dir(otherImages, { depth: null });
    };
    const addImageField = () => {
        setOtherImages([...otherImages, ""]);
    };
    const removeImageField = (index) => {
        setOtherImages(otherImages.filter((item, i) => i != index));
    };
    const handleSubmit = (e) => {
        e.preventDefault();
        // console.dir(e, { depth: null });

        if (!productName) {
            setErrorMessage("Give Product Name");
            return;
        }
        if (!productImage) {
            setErrorMessage("Give primary image url");
            return;
        }
        if (!isValidImage) {
            setErrorMessage("Invalid Image Url");
            return;
        }
        if (!productPrice) {
            setErrorMessage("Give Price");
            return;
        }
        if (!productCategoryId) {
            setErrorMessage("Select product category");
            return;
        }
        if (!productDetails) {
            setErrorMessage("Mention Product Details");
            return;
        }
        setErrorMessage("");
        // console.dir(otherImages, { depth: null });
        updateProduct();
    };

    return (
        <div className="updateProduct">
            <h3>Update Product</h3>

            <form className="updateProduct-product-form">
                <div className="updateProduct-form-item updateProduct-product-name">
                    <div className="updateProduct-form-item-label">
                        Product Name
                    </div>
                    <div className="updateProduct-form-item-input">
                        <input
                            type="text"
                            value={productName}
                            onChange={(e) => setProductName(e.target.value)}
                            placeholder="Product Name"
                        />
                    </div>
                </div>
                <div className="updateProduct-form-item updateProduct-product-image">
                    <div className="updateProduct-form-item-label">
                        Image Url
                    </div>
                    <div className="updateProduct-form-item-input">
                        <input
                            type="text"
                            value={productImage}
                            onChange={handleImageChange}
                            placeholder="Enter image URL"
                        />
                        {productImage && (
                            <div className="updateProduct-image-preview">
                                <img src={productImage} alt={`invalid URL`} />
                            </div>
                        )}
                    </div>
                </div>
                <div className="updateProduct-form-item updateProduct-product-price">
                    <div className="updateProduct-form-item-label">Price</div>
                    <div className="updateProduct-form-item-input">
                        <input
                            type="number"
                            value={productPrice}
                            onChange={(e) => setProductPrice(e.target.value)}
                            placeholder="Product Price"
                        />
                    </div>
                </div>
                <div className="updateProduct-form-item updateProduct-product-category">
                    <div className="updateProduct-form-item-label">
                        Category
                    </div>
                    <div className="updateProduct-form-item-input">
                        <select
                            className="updateProduct-form-item-input-select"
                            value={productCategoryName}
                            onChange={(e) => {
                                console.log(e.target.value);
                                setProductCategoryId(e.target.value);
                                const cName = categories.find((category) => {
                                    if (category.id === e.target.value)
                                        return category.name;
                                });
                                setProductCategoryName(cName);
                            }}
                        >
                            <option
                                // id="disabled-option"
                                className="updateProduct-select-option"
                                value={productCategoryId}
                            >
                                {productCategoryName}
                            </option>
                            {/* <option id="disabled-option" value="">
                                Select a category
                            </option> */}
                            {categories &&
                                categories.map((category, index) => {
                                    return (
                                        <option
                                            key={index}
                                            className="updateProduct-select-option"
                                            value={category.id}
                                        >
                                            {category.name}
                                        </option>
                                    );
                                })}
                        </select>
                    </div>
                </div>
                <div className="updateProduct-form-item updateProduct-product-details">
                    <div className="updateProduct-form-item-label">Details</div>
                    <div className="updateProduct-form-item-input">
                        <input
                            type="textarea"
                            value={productDetails}
                            onChange={(e) => setProductDetails(e.target.value)}
                            placeholder="Product Details"
                        />
                    </div>
                </div>
                <div className="updateProduct-form-item updateProduct-product-other-images">
                    <div className="updateProduct-form-item-label">
                        {"Other Images"}
                    </div>
                    <div
                        className="updateProduct-form-item-input"
                        id="input-image-div"
                    >
                        {otherImages.map((image, index) => (
                            <div
                                className="updateProduct-form-item-input-images updateProduct-form-item-input"
                                key={index}
                            >
                                <input
                                    type="text"
                                    value={image}
                                    onChange={(e) =>
                                        handleImagesChange(
                                            index,
                                            e.target.value
                                        )
                                    }
                                    placeholder="Enter image URL"
                                />
                                {image && (
                                    <div className="images-preview">
                                        <img src={image} alt="invalid URL" />
                                    </div>
                                )}
                                <button
                                    type="button"
                                    className="updateProduct-product-form-delete-image-button"
                                    onClick={() => removeImageField(index)}
                                >
                                    ❌
                                </button>
                            </div>
                        ))}
                        <div className="updateProduct-add-another-image-button">
                            <button
                                id="updateProduct-add-another-image-button"
                                type="button"
                                onClick={addImageField}
                            >
                                Add another image
                            </button>
                        </div>
                    </div>
                </div>

                <div className="updateProduct-product-form-error-message updateProduct-product-form-success-message">
                    {errorMessage ? errorMessage : successMessage}
                </div>

                <button
                    className="updateProduct-product-form-submit-button"
                    type="submit"
                    onClick={handleSubmit}
                >
                    Update
                </button>
            </form>
        </div>
    );
}

export default UpdateProduct;
