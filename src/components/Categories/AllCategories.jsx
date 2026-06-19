import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import api from "../../api";

const EMPTY = { name: "", name_bn: "", image_url: "" };

export default function AllCategories() {
    const { t } = useTranslation();
    const [categories, setCategories] = useState([]);
    const [form, setForm] = useState(EMPTY);
    const [editId, setEditId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const fetchCategories = async () => {
        try {
            const { data } = await api.get("/admin/api/categories");
            setCategories(data.categories || []);
        } catch { setError("Failed to load categories."); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchCategories(); }, []);

    const handleSave = async () => {
        if (!form.name.trim()) return;
        setSaving(true); setError("");
        try {
            if (editId) {
                const { data } = await api.put(`/admin/api/categories/${editId}`, form);
                setCategories((prev) => prev.map((c) => (c.id === editId ? data.category : c)));
            } else {
                const { data } = await api.post("/admin/api/categories", form);
                setCategories((prev) => [...prev, data.category]);
            }
            setForm(EMPTY);
            setEditId(null);
        } catch (err) {
            setError(err.response?.data?.error || "Save failed.");
        } finally { setSaving(false); }
    };

    const startEdit = (cat) => {
        setForm({ name: cat.name, name_bn: cat.name_bn || "", image_url: cat.image_url || "" });
        setEditId(cat.id);
    };

    const deleteCategory = async (id, name) => {
        if (!window.confirm(t("categories.delete_confirm", { name }))) return;
        try {
            await api.delete(`/admin/api/categories/${id}`);
            setCategories((prev) => prev.filter((c) => c.id !== id));
        } catch (err) {
            setError(err.response?.data?.error || "Delete failed.");
        }
    };

    if (loading) return <div style={{ padding: 40, color: "#636e72" }}>{t("categories.loading")}</div>;

    return (
        <div>
            <div className="topbar"><h1>{t("categories.title")}</h1></div>
            {error && <div className="alert alert-error">{error}</div>}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, alignItems: "start" }}>
                {/* Form */}
                <div className="card">
                    <div className="card-header">
                        <h2>{editId ? t("categories.edit") : t("categories.add")}</h2>
                        {editId && <button className="btn btn-outline btn-sm" onClick={() => { setEditId(null); setForm(EMPTY); }}>{t("categories.cancel")}</button>}
                    </div>
                    <div className="form-group" style={{ marginBottom: 12 }}>
                        <label>{t("categories.name")} *</label>
                        <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                            placeholder={t("categories.name_placeholder")} />
                    </div>
                    <div className="form-group" style={{ marginBottom: 12 }}>
                        <label>{t("categories.name_bn")}</label>
                        <input value={form.name_bn} onChange={(e) => setForm({ ...form, name_bn: e.target.value })}
                            placeholder={t("categories.name_bn_placeholder")} />
                    </div>
                    <div className="form-group" style={{ marginBottom: 16 }}>
                        <label>{t("categories.image_url")}</label>
                        <input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                            placeholder="https://..." />
                    </div>
                    <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                        {saving ? t("categories.saving") : editId ? t("categories.update_btn") : t("categories.add_btn")}
                    </button>
                </div>

                {/* List */}
                <div className="card">
                    <div className="card-header"><h2>{t("categories.count", { count: categories.length })}</h2></div>
                    {categories.length === 0 && (
                        <div className="empty-state">
                            <div className="empty-icon">🏷️</div>
                            <h3>{t("categories.none")}</h3>
                        </div>
                    )}
                    {categories.map((cat) => (
                        <div key={cat.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid #f5f6fa" }}>
                            {cat.image_url ? (
                                <img src={cat.image_url} alt={cat.name} style={{ width: 40, height: 40, borderRadius: 8, objectFit: "cover" }} />
                            ) : (
                                <div style={{ width: 40, height: 40, borderRadius: 8, background: "#f5f6fa", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🏷️</div>
                            )}
                            <span style={{ flex: 1, fontWeight: 500 }}>
                                {cat.name}
                                {cat.name_bn && <span style={{ color: "#636e72", fontWeight: 400 }}> · {cat.name_bn}</span>}
                            </span>
                            <button className="btn btn-outline btn-sm" onClick={() => startEdit(cat)}>{t("categories.edit_btn")}</button>
                            <button className="btn btn-danger btn-sm" onClick={() => deleteCategory(cat.id, cat.name)}>{t("categories.delete_btn")}</button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
