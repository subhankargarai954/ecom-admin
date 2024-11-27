import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";


import "./AddProduct.css";

function AddProduct() {
    const ADMIN_API_PRODUCTS = process.env.REACT_APP_ADMIN_API_PRODUCTS;

    const [productName, setProductName] = useState("");
    const [productImage, setProductImage] = useState("");
    const [productPrice, setProductPrice] = useState("");
    const [productCategory, setProductCategory] = useState("");
    const [productDetails, setProductDetails] = useState("");
    const [otherImages, setOtherImages] = useState([]);

    const [categories, setCategories] = useState([]);

    const [successMessage, setSuccessMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [isValidImage, setIsValidImage] = useState(false);
    const navigate = useNavigate();

    /////////////////////////// GET //////////////////////////////
    useEffect(() => {
        const getAllCategoryName = async () => {
            const response = await axios.get(`${ADMIN_API_PRODUCTS}/category`);
            // console.dir(response.data, { depth: null });
            setCategories(response.data.categories);
            // console.dir(categories, { depth: null });
        };
        getAllCategoryName();
    }, []);

    /////////////////////////// POST /////////////////////////////

    // const storeImages = async () => {
    //     try {
    //         const response = await axios.post(
    //             `${ADMIN_API_PRODUCTS}/otherimages`,
    //             {
    //                 images: otherImages,
    //                 productId: response.data.id,
    //             }
    //         );
    //         console.dir(response.data, { depth: null });
    //     } catch (error) {
    //         console.dir(error, { depth: null });
    //     }
    // };

    const storeProduct = async () => {
        try {
            const response = await axios.post(`${ADMIN_API_PRODUCTS}/`, {
                prodName: productName,
                prodImage: productImage,
                prodPrice: productPrice,
                prodCategoryId: productCategory,
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
                        setSuccessMessage("Successfully Added");
                        setTimeout(() => {
                            setSuccessMessage("");
                            // navigate("/");
                            navigate("/Products");
                        }, 1000);
                    }
                } catch (error) {
                    console.dir(error, { depth: null });
                    // setErrorMessage(`${error}`);
                }
            } else if (response.data.error) {
                setErrorMessage(`${response.data.error}`);
            }
        } catch (error) {
            console.log(error);
            setErrorMessage("Product Not Added");
        }

        setTimeout(() => {
            setSuccessMessage("");
            setErrorMessage("");
        }, 3000);
    };

    /////////////////////////// modify ///////////////////////////
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
        const updatedImages = [...otherImages];
        updatedImages[index] = value;
        setOtherImages(updatedImages);
    };
    const addImageField = () => {
        setOtherImages([...otherImages, ""]);
    };
    const removeImageField = (index) => {
        setOtherImages(otherImages.filter((item, i) => i !== index));
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
        if (!productCategory) {
            setErrorMessage("Select product category");
            return;
        }
        if (!productDetails) {
            setErrorMessage("Mention Product Details");
            return;
        }
        setErrorMessage("");
        // console.dir(otherImages, { depth: null });
        storeProduct();
    };

    return (
        <div className="addProduct">
            <h3>Add New Product</h3>

            <form className="product-form">
                <div className="form-item product-name">
                    <div className="form-item-label">Product Name</div>
                    <div className="form-item-input">
                        <input
                            type="text"
                            value={productName}
                            onChange={(e) => setProductName(e.target.value)}
                            placeholder="Product Name"
                        />
                    </div>
                </div>
                <div className="form-item product-image">
                    <div className="form-item-label">Image Url</div>
                    <div className="form-item-input">
                        <input
                            type="text"
                            value={productImage}
                            onChange={handleImageChange}
                            placeholder="Enter image URL"
                        />
                        {productImage && (
                            <div className="image-preview">
                                <img src={productImage} alt={`invalid URL`} />
                            </div>
                        )}
                    </div>
                </div>
                <div className="form-item product-price">
                    <div className="form-item-label">Price</div>
                    <div className="form-item-input">
                        <input
                            type="number"
                            value={productPrice}
                            onChange={(e) => setProductPrice(e.target.value)}
                            placeholder="Product Price"
                        />
                    </div>
                </div>
                <div className="form-item product-category">
                    <div className="form-item-label">Category</div>
                    <div className="form-item-input">
                        <select
                            className="form-item-input-select"
                            value={productCategory}
                            onChange={(e) => setProductCategory(e.target.value)}
                        >
                            <option id="disabled-option" value="">
                                Select a category
                            </option>
                            {categories &&
                                categories.map((category, index) => {
                                    return (
                                        <option
                                            key={index}
                                            className="select-option"
                                            value={category.id}
                                        >
                                            {category.name}
                                        </option>
                                    );
                                })}
                        </select>
                    </div>
                </div>
                <div className="form-item product-details">
                    <div className="form-item-label">Details</div>
                    <div className="form-item-input">
                        <input
                            type="textarea"
                            value={productDetails}
                            onChange={(e) => setProductDetails(e.target.value)}
                            placeholder="Product Details"
                        />
                    </div>
                </div>
                <div className="form-item product-other-images">
                    <div className="form-item-label">{"Other Images"}</div>
                    <div className="form-item-input" id="input-image-div">
                        {otherImages.map((image, index) => (
                            <div
                                className="form-item-input-images form-item-input"
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
                                    className="product-form-delete-image-button"
                                    onClick={() => removeImageField(index)}
                                >
                                    ❌
                                </button>
                            </div>
                        ))}
                        <div className="add-another-image-button">
                            <button
                                id="add-another-image-button"
                                type="button"
                                onClick={addImageField}
                            >
                                Add another image
                            </button>
                        </div>
                    </div>
                </div>

                <div className="product-form-error-message product-form-success-message">
                    {errorMessage ? errorMessage : successMessage}
                </div>

                <button
                    className="product-form-submit-button"
                    type="submit"
                    onClick={handleSubmit}
                >
                    Add Product
                </button>
            </form>
        </div>
    );
}

export default AddProduct;
