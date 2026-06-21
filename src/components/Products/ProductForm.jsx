import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import api from "../../api";

export default function ProductForm() {
    const { t } = useTranslation();
    const { id } = useParams();
    const isEdit = Boolean(id);
    const navigate = useNavigate();

    const [form, setForm] = useState({
        name: "", name_bn: "", category_id: "", base_price: "", discount_percent: "",
        description: "", description_bn: "", available_quantity: "0", is_active: true,
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
                    name: p.name, name_bn: p.name_bn || "", category_id: p.category_id || "",
                    base_price: p.base_price, discount_percent: p.discount_percent || "0",
                    description: p.description || "", description_bn: p.description_bn || "",
                    available_quantity: p.available_quantity || "0",
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

            setSuccess(isEdit ? t("product_form.updated") : t("product_form.created"));
            setTimeout(() => navigate("/products"), 1000);
        } catch (err) {
            setError(err.response?.data?.error || t("product_form.save_failed"));
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
            if (!window.confirm(t("product_form.delete_variant_confirm", { name: v.variant_name }))) return;
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
        if (!window.confirm(t("product_form.delete_image_confirm"))) return;
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
                <h1>{isEdit ? t("product_form.edit_title") : t("product_form.add_title")}</h1>
                <button className="btn btn-outline" onClick={() => navigate("/products")}>← {t("product_form.back")}</button>
            </div>

            {error && <div className="alert alert-error">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}

            <form onSubmit={handleSaveProduct}>
                {/* Basic Info */}
                <div className="card">
                    <div className="card-header"><h2>{t("product_form.details")}</h2></div>
                    <div className="form-grid">
                        <div className="form-group">
                            <label>{t("product_form.name")} *</label>
                            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                                placeholder={t("product_form.name_placeholder")} required />
                        </div>
                        <div className="form-group">
                            <label>{t("product_form.name_bn")}</label>
                            <input value={form.name_bn} onChange={(e) => setForm({ ...form, name_bn: e.target.value })}
                                placeholder={t("product_form.name_bn_placeholder")} />
                        </div>
                        <div className="form-group">
                            <label>{t("product_form.category")}</label>
                            <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}>
                                <option value="">{t("product_form.no_category")}</option>
                                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>{t("product_form.base_price")} *</label>
                            <input type="number" step="0.01" min="0" value={form.base_price}
                                onChange={(e) => setForm({ ...form, base_price: e.target.value })}
                                placeholder="0.00" required />
                        </div>
                        <div className="form-group">
                            <label>{t("product_form.discount")}</label>
                            <input type="number" step="0.01" min="0" max="100" value={form.discount_percent}
                                onChange={(e) => setForm({ ...form, discount_percent: e.target.value })}
                                placeholder="0" />
                        </div>
                        {!hasVariants && (
                            <div className="form-group">
                                <label>{t("product_form.available_qty")}</label>
                                <input type="number" min="0" value={form.available_quantity}
                                    onChange={(e) => setForm({ ...form, available_quantity: e.target.value })} />
                            </div>
                        )}
                        <div className="form-group">
                            <label>{t("product_form.status")}</label>
                            <select value={form.is_active ? "true" : "false"}
                                onChange={(e) => setForm({ ...form, is_active: e.target.value === "true" })}>
                                <option value="true">{t("product_form.active")}</option>
                                <option value="false">{t("product_form.inactive")}</option>
                            </select>
                        </div>
                        <div className="form-group full-width">
                            <label>{t("product_form.description")}</label>
                            <textarea value={form.description}
                                onChange={(e) => setForm({ ...form, description: e.target.value })}
                                placeholder={t("product_form.description_placeholder")} rows={3} />
                        </div>
                        <div className="form-group full-width">
                            <label>{t("product_form.description_bn")}</label>
                            <textarea value={form.description_bn}
                                onChange={(e) => setForm({ ...form, description_bn: e.target.value })}
                                placeholder={t("product_form.description_bn_placeholder")} rows={3} />
                        </div>
                        <div className="form-group full-width">
                            <p style={{ fontSize: 12, color: "var(--text-muted)" }}>{t("product_form.bn_hint")}</p>
                        </div>
                    </div>
                </div>

                {/* Variants */}
                <div className="card">
                    <div className="card-header">
                        <h2>{t("product_form.variants")} <small style={{ color: "var(--text-muted)", fontWeight: 400 }}>{t("product_form.variants_hint")}</small></h2>
                    </div>
                    {hasVariants && (
                        <div style={{ marginBottom: 16 }}>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: 8, fontWeight: 600, fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", padding: "0 0 6px", borderBottom: "1px solid var(--border)", marginBottom: 8 }}>
                                <span>{t("product_form.variant_name")}</span><span>{t("product_form.price_override")}</span><span>{t("product_form.qty")}</span><span></span>
                            </div>
                            {variants.map((v) => (
                                <div key={v.id} className="variant-row">
                                    <input value={v.variant_name}
                                        onChange={(e) => updateVariantField(v, "variant_name", e.target.value)}
                                        style={{ padding: "8px 10px", border: "1px solid var(--border)", borderRadius: 6, fontSize: 13 }} />
                                    <input type="number" step="0.01" min="0" value={v.price_override || ""}
                                        onChange={(e) => updateVariantField(v, "price_override", e.target.value)}
                                        placeholder="—"
                                        style={{ padding: "8px 10px", border: "1px solid var(--border)", borderRadius: 6, fontSize: 13 }} />
                                    <input type="number" min="0" value={v.available_quantity}
                                        onChange={(e) => updateVariantField(v, "available_quantity", e.target.value)}
                                        style={{ padding: "8px 10px", border: "1px solid var(--border)", borderRadius: 6, fontSize: 13 }} />
                                    <button type="button" onClick={() => removeVariant(v)} className="btn btn-danger btn-sm">✕</button>
                                </div>
                            ))}
                        </div>
                    )}
                    <div className="variant-row" style={{ marginTop: 8 }}>
                        <input placeholder={t("product_form.variant_name_placeholder")} value={newVariant.variant_name}
                            onChange={(e) => setNewVariant({ ...newVariant, variant_name: e.target.value })}
                            style={{ padding: "8px 10px", border: "1px solid var(--border)", borderRadius: 6, fontSize: 13 }} />
                        <input type="number" step="0.01" min="0" placeholder={t("product_form.price_optional")}
                            value={newVariant.price_override}
                            onChange={(e) => setNewVariant({ ...newVariant, price_override: e.target.value })}
                            style={{ padding: "8px 10px", border: "1px solid var(--border)", borderRadius: 6, fontSize: 13 }} />
                        <input type="number" min="0" placeholder={t("product_form.qty")}
                            value={newVariant.available_quantity}
                            onChange={(e) => setNewVariant({ ...newVariant, available_quantity: e.target.value })}
                            style={{ padding: "8px 10px", border: "1px solid var(--border)", borderRadius: 6, fontSize: 13 }} />
                        <button type="button" onClick={addVariant} className="btn btn-success btn-sm">+ {t("product_form.add")}</button>
                    </div>
                    {hasVariants && (
                        <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 10 }}>
                            {t("product_form.variants_note")}
                        </p>
                    )}
                </div>

                {/* Images */}
                <div className="card">
                    <div className="card-header">
                        <h2>{t("product_form.images")}</h2>
                        {imgLoading && <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{t("product_form.uploading")}</span>}
                    </div>

                    {/* Existing images */}
                    {images.length > 0 && (
                        <div style={{ marginBottom: 16 }}>
                            <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 8 }}>
                                {t("product_form.existing_images")}
                            </p>
                            <div className="image-preview-grid">
                                {images.map((img, idx) => (
                                    <div
                                        key={img.id}
                                        className={`image-preview-item ${img.is_cover ? "cover" : ""}`}
                                        onClick={() => setCoverExisting(img.id, idx)}
                                    >
                                        <img src={img.image_url} alt="" />
                                        {img.is_cover && <div className="cover-badge">{t("product_form.cover")}</div>}
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
                        <p><strong>{t("product_form.click_upload")}</strong></p>
                        <p>{t("product_form.upload_hint")}</p>
                    </div>

                    {previews.length > 0 && (
                        <div style={{ marginTop: 12 }}>
                            <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 8 }}>
                                {t("product_form.new_images")}
                            </p>
                            <div className="image-preview-grid">
                                {previews.map((url, idx) => (
                                    <div
                                        key={idx}
                                        className={`image-preview-item ${idx === coverIndex ? "cover" : ""}`}
                                        onClick={() => setCoverIndex(idx)}
                                    >
                                        <img src={url} alt="" />
                                        {idx === coverIndex && <div className="cover-badge">{t("product_form.cover")}</div>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
                    <button type="button" className="btn btn-outline" onClick={() => navigate("/products")}>{t("product_form.cancel")}</button>
                    <button type="submit" className="btn btn-primary" disabled={loading || imgLoading}>
                        {loading ? t("product_form.saving") : isEdit ? t("product_form.update") : t("product_form.create")}
                    </button>
                </div>
            </form>
        </div>
    );
}
