import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api";

export default function ProductForm() {
    const { id } = useParams();
    const isEdit = Boolean(id);
    const navigate = useNavigate();

    const [form, setForm] = useState({
        name: "", category_id: "", base_price: "", discount_percent: "",
        description: "", available_quantity: "0", is_active: true,
    });
    const [categories, setCategories] = useState([]);
    const [variants, setVariants] = useState([]);
    const [newVariant, setNewVariant] = useState({ variant_name: "", price_override: "", available_quantity: "" });
    const [images, setImages] = useState([]);       // existing images from server
    const [newFiles, setNewFiles] = useState([]);   // files to upload
    const [previews, setPreviews] = useState([]);   // preview URLs for new files
    const [coverIndex, setCoverIndex] = useState(0);
    const [loading, setLoading] = useState(false);
    const [imgLoading, setImgLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const fileRef = useRef();

    useEffect(() => {
        api.get("/admin/api/categories").then((r) => setCategories(r.data.categories || []));
        if (isEdit) {
            api.get(`/admin/api/products/${id}`).then((r) => {
                const p = r.data.product;
                setForm({
                    name: p.name, category_id: p.category_id || "",
                    base_price: p.base_price, discount_percent: p.discount_percent || "0",
                    description: p.description || "", available_quantity: p.available_quantity || "0",
                    is_active: p.is_active,
                });
                setVariants(p.variants || []);
                setImages(p.images || []);
                const coverIdx = p.images?.findIndex((i) => i.is_cover);
                if (coverIdx >= 0) setCoverIndex(coverIdx);
            });
        }
    }, [id, isEdit]);

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        setNewFiles(files);
        setPreviews(files.map((f) => URL.createObjectURL(f)));
        setCoverIndex(0);
    };

    const handleSaveProduct = async (e) => {
        e.preventDefault();
        setError(""); setSuccess(""); setLoading(true);
        try {
            let productId = id;
            if (isEdit) {
                await api.put(`/admin/api/products/${id}`, form);
            } else {
                const { data } = await api.post("/admin/api/products", { ...form, variants });
                productId = data.product.id;
            }

            // Upload new images if any
            if (newFiles.length > 0) {
                setImgLoading(true);
                const fd = new FormData();
                newFiles.forEach((f) => fd.append("images", f));
                fd.append("cover_index", coverIndex);
                await api.post(`/admin/api/products/${productId}/images`, fd, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
                setImgLoading(false);
            }

            setSuccess(isEdit ? "Product updated!" : "Product created!");
            setTimeout(() => navigate("/products"), 1000);
        } catch (err) {
            setError(err.response?.data?.error || "Save failed.");
        } finally {
            setLoading(false);
        }
    };

    const addVariant = async () => {
        if (!newVariant.variant_name.trim()) return;
        if (isEdit) {
            try {
                const { data } = await api.post(`/admin/api/products/${id}/variants`, newVariant);
                setVariants((prev) => [...prev, data.variant]);
            } catch (err) {
                setError(err.response?.data?.error || "Failed to add variant.");
                return;
            }
        } else {
            setVariants((prev) => [...prev, { ...newVariant, id: Date.now() }]);
        }
        setNewVariant({ variant_name: "", price_override: "", available_quantity: "" });
    };

    const removeVariant = async (v) => {
        if (isEdit) {
            if (!window.confirm(`Delete variant "${v.variant_name}"?`)) return;
            try {
                await api.delete(`/admin/api/products/${id}/variants/${v.id}`);
            } catch (err) {
                setError("Failed to delete variant.");
                return;
            }
        }
        setVariants((prev) => prev.filter((x) => x.id !== v.id));
    };

    const updateVariantField = async (v, field, value) => {
        const updated = { ...v, [field]: value };
        if (isEdit) {
            try {
                await api.put(`/admin/api/products/${id}/variants/${v.id}`, updated);
            } catch {}
        }
        setVariants((prev) => prev.map((x) => (x.id === v.id ? updated : x)));
    };

    const setCoverExisting = async (imgId, idx) => {
        if (isEdit) {
            try {
                await api.put(`/admin/api/products/${id}/images/cover`, { image_id: imgId });
                setImages((prev) => prev.map((img, i) => ({ ...img, is_cover: i === idx })));
            } catch {}
        }
    };

    const deleteExistingImage = async (imgId) => {
        if (!window.confirm("Delete this image?")) return;
        try {
            await api.delete(`/admin/api/products/${id}/images/${imgId}`);
            setImages((prev) => prev.filter((img) => img.id !== imgId));
        } catch (err) {
            setError("Failed to delete image.");
        }
    };

    const hasVariants = variants.length > 0;

    return (
        <div>
            <div className="topbar">
                <h1>{isEdit ? "Edit Product" : "Add New Product"}</h1>
                <button className="btn btn-outline" onClick={() => navigate("/products")}>← Back</button>
            </div>

            {error && <div className="alert alert-error">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}

            <form onSubmit={handleSaveProduct}>
                {/* Basic Info */}
                <div className="card">
                    <div className="card-header"><h2>Product Details</h2></div>
                    <div className="form-grid">
                        <div className="form-group full-width">
                            <label>Product Name *</label>
                            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                                placeholder="e.g. Organic Basmati Rice" required />
                        </div>
                        <div className="form-group">
                            <label>Category</label>
                            <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}>
                                <option value="">— No Category —</option>
                                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Base Price (₹) *</label>
                            <input type="number" step="0.01" min="0" value={form.base_price}
                                onChange={(e) => setForm({ ...form, base_price: e.target.value })}
                                placeholder="0.00" required />
                        </div>
                        <div className="form-group">
                            <label>Discount (%)</label>
                            <input type="number" step="0.01" min="0" max="100" value={form.discount_percent}
                                onChange={(e) => setForm({ ...form, discount_percent: e.target.value })}
                                placeholder="0" />
                        </div>
                        {!hasVariants && (
                            <div className="form-group">
                                <label>Available Quantity</label>
                                <input type="number" min="0" value={form.available_quantity}
                                    onChange={(e) => setForm({ ...form, available_quantity: e.target.value })} />
                            </div>
                        )}
                        <div className="form-group">
                            <label>Status</label>
                            <select value={form.is_active ? "true" : "false"}
                                onChange={(e) => setForm({ ...form, is_active: e.target.value === "true" })}>
                                <option value="true">Active</option>
                                <option value="false">Inactive</option>
                            </select>
                        </div>
                        <div className="form-group full-width">
                            <label>Description</label>
                            <textarea value={form.description}
                                onChange={(e) => setForm({ ...form, description: e.target.value })}
                                placeholder="Product description, features, etc." rows={3} />
                        </div>
                    </div>
                </div>

                {/* Variants */}
                <div className="card">
                    <div className="card-header">
                        <h2>Variants <small style={{ color: "#636e72", fontWeight: 400 }}>(optional — e.g. 1kg, 500g, Red, Blue)</small></h2>
                    </div>
                    {hasVariants && (
                        <div style={{ marginBottom: 16 }}>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: 8, fontWeight: 600, fontSize: 11, color: "#636e72", textTransform: "uppercase", padding: "0 0 6px", borderBottom: "1px solid #f5f6fa", marginBottom: 8 }}>
                                <span>Variant Name</span><span>Price Override (₹)</span><span>Qty</span><span></span>
                            </div>
                            {variants.map((v) => (
                                <div key={v.id} className="variant-row">
                                    <input value={v.variant_name}
                                        onChange={(e) => updateVariantField(v, "variant_name", e.target.value)}
                                        style={{ padding: "8px 10px", border: "1px solid #dfe6e9", borderRadius: 6, fontSize: 13 }} />
                                    <input type="number" step="0.01" min="0" value={v.price_override || ""}
                                        onChange={(e) => updateVariantField(v, "price_override", e.target.value)}
                                        placeholder="—"
                                        style={{ padding: "8px 10px", border: "1px solid #dfe6e9", borderRadius: 6, fontSize: 13 }} />
                                    <input type="number" min="0" value={v.available_quantity}
                                        onChange={(e) => updateVariantField(v, "available_quantity", e.target.value)}
                                        style={{ padding: "8px 10px", border: "1px solid #dfe6e9", borderRadius: 6, fontSize: 13 }} />
                                    <button type="button" onClick={() => removeVariant(v)} className="btn btn-danger btn-sm">✕</button>
                                </div>
                            ))}
                        </div>
                    )}
                    <div className="variant-row" style={{ marginTop: 8 }}>
                        <input placeholder="Variant name (e.g. 1kg)" value={newVariant.variant_name}
                            onChange={(e) => setNewVariant({ ...newVariant, variant_name: e.target.value })}
                            style={{ padding: "8px 10px", border: "1px solid #dfe6e9", borderRadius: 6, fontSize: 13 }} />
                        <input type="number" step="0.01" min="0" placeholder="Price (optional)"
                            value={newVariant.price_override}
                            onChange={(e) => setNewVariant({ ...newVariant, price_override: e.target.value })}
                            style={{ padding: "8px 10px", border: "1px solid #dfe6e9", borderRadius: 6, fontSize: 13 }} />
                        <input type="number" min="0" placeholder="Qty"
                            value={newVariant.available_quantity}
                            onChange={(e) => setNewVariant({ ...newVariant, available_quantity: e.target.value })}
                            style={{ padding: "8px 10px", border: "1px solid #dfe6e9", borderRadius: 6, fontSize: 13 }} />
                        <button type="button" onClick={addVariant} className="btn btn-success btn-sm">+ Add</button>
                    </div>
                    {hasVariants && (
                        <p style={{ fontSize: 12, color: "#636e72", marginTop: 10 }}>
                            💡 When variants exist, stock is tracked per variant. The product-level quantity is ignored.
                        </p>
                    )}
                </div>

                {/* Images */}
                <div className="card">
                    <div className="card-header">
                        <h2>Product Images</h2>
                        {imgLoading && <span style={{ fontSize: 12, color: "#636e72" }}>Uploading…</span>}
                    </div>

                    {/* Existing images */}
                    {images.length > 0 && (
                        <div style={{ marginBottom: 16 }}>
                            <p style={{ fontSize: 12, color: "#636e72", marginBottom: 8 }}>
                                Existing images (click to set as cover):
                            </p>
                            <div className="image-preview-grid">
                                {images.map((img, idx) => (
                                    <div
                                        key={img.id}
                                        className={`image-preview-item ${img.is_cover ? "cover" : ""}`}
                                        onClick={() => setCoverExisting(img.id, idx)}
                                    >
                                        <img src={img.image_url} alt="" />
                                        {img.is_cover && <div className="cover-badge">COVER</div>}
                                        <button
                                            type="button"
                                            className="delete-img-btn"
                                            onClick={(e) => { e.stopPropagation(); deleteExistingImage(img.id); }}
                                        >✕</button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* New upload */}
                    <div className="image-upload-zone" onClick={() => fileRef.current.click()}>
                        <input type="file" ref={fileRef} accept="image/*" multiple onChange={handleFileChange} />
                        <div style={{ fontSize: 32 }}>📷</div>
                        <p><strong>Click to upload images</strong></p>
                        <p>JPG, PNG, WEBP · Max 5MB per image · Up to 10 images</p>
                    </div>

                    {previews.length > 0 && (
                        <div style={{ marginTop: 12 }}>
                            <p style={{ fontSize: 12, color: "#636e72", marginBottom: 8 }}>
                                New images to upload (click to set as cover):
                            </p>
                            <div className="image-preview-grid">
                                {previews.map((url, idx) => (
                                    <div
                                        key={idx}
                                        className={`image-preview-item ${idx === coverIndex ? "cover" : ""}`}
                                        onClick={() => setCoverIndex(idx)}
                                    >
                                        <img src={url} alt="" />
                                        {idx === coverIndex && <div className="cover-badge">COVER</div>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
                    <button type="button" className="btn btn-outline" onClick={() => navigate("/products")}>Cancel</button>
                    <button type="submit" className="btn btn-primary" disabled={loading || imgLoading}>
                        {loading ? "Saving…" : isEdit ? "Update Product" : "Create Product"}
                    </button>
                </div>
            </form>
        </div>
    );
}
