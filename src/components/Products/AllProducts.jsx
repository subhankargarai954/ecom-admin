import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import api from "../../api";

export default function AllProducts() {
    const { t } = useTranslation();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");

    const fetchProducts = async () => {
        try {
            const { data } = await api.get("/admin/api/products");
            setProducts(data.products || []);
        } catch (err) {
            setError(t("products.load_failed"));
        } finally {
            setLoading(false);
        }
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => { fetchProducts(); }, []);

    const deleteProduct = async (id, name) => {
        if (!window.confirm(t("products.delete_confirm", { name }))) return;
        try {
            await api.delete(`/admin/api/products/${id}`);
            setProducts((prev) => prev.filter((p) => p.id !== id));
        } catch (err) {
            alert(err.response?.data?.error || "Delete failed.");
        }
    };

    const filtered = products.filter((p) =>
        p.name.toLowerCase().includes(search.toLowerCase())
    );

    if (loading) return <div style={{ padding: 40, color: "#636e72" }}>{t("products.loading")}</div>;

    return (
        <div>
            <div className="topbar">
                <h1>{t("products.title")}</h1>
                <Link to="/products/new" className="btn btn-primary">+ {t("products.add_product")}</Link>
            </div>
            {error && <div className="alert alert-error">{error}</div>}
            <div className="card">
                <div className="card-header">
                    <h2>{t("products.count", { count: products.length })}</h2>
                    <input
                        type="text"
                        placeholder={t("products.search")}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{ padding: "7px 12px", border: "1px solid #dfe6e9", borderRadius: 6, fontSize: 13, width: 220 }}
                    />
                </div>
                <div className="table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                <th>{t("products.col_image")}</th>
                                <th>{t("products.col_name")}</th>
                                <th>{t("products.col_category")}</th>
                                <th>{t("products.col_price")}</th>
                                <th>{t("products.col_discount")}</th>
                                <th>{t("products.col_stock")}</th>
                                <th>{t("products.col_variants")}</th>
                                <th>{t("products.col_status")}</th>
                                <th>{t("products.col_actions")}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 && (
                                <tr><td colSpan={9}>
                                    <div className="empty-state">
                                        <div className="empty-icon">📦</div>
                                        <h3>{t("products.none_title")}</h3>
                                        <p>{t("products.none_hint")}</p>
                                    </div>
                                </td></tr>
                            )}
                            {filtered.map((p) => {
                                const cover = p.images?.find((i) => i.is_cover) || p.images?.[0];
                                const totalStock = p.variants?.length
                                    ? p.variants.reduce((s, v) => s + (v.available_quantity || 0), 0)
                                    : p.available_quantity;
                                const effectivePrice = parseFloat(p.base_price) * (1 - parseFloat(p.discount_percent || 0) / 100);
                                return (
                                    <tr key={p.id}>
                                        <td>
                                            {cover ? (
                                                <img src={cover.image_url} alt={p.name} className="product-thumb" />
                                            ) : (
                                                <div className="no-img">📦</div>
                                            )}
                                        </td>
                                        <td>
                                            <strong>{p.name}</strong>
                                            {p.name_bn && <small style={{ color: "#636e72", display: "block" }}>{p.name_bn}</small>}
                                        </td>
                                        <td>{p.category?.name || "—"}</td>
                                        <td>
                                            ₹{effectivePrice.toFixed(2)}
                                            {parseFloat(p.discount_percent) > 0 && (
                                                <small style={{ color: "#636e72", display: "block" }}>{t("products.mrp")} ₹{parseFloat(p.base_price).toFixed(2)}</small>
                                            )}
                                        </td>
                                        <td>{parseFloat(p.discount_percent) > 0 ? `${p.discount_percent}%` : "—"}</td>
                                        <td>
                                            <span style={{ color: totalStock === 0 ? "#d63031" : "#00b894", fontWeight: 600 }}>
                                                {totalStock}
                                            </span>
                                        </td>
                                        <td>{p.variants?.length || 0}</td>
                                        <td>
                                            <span className={`badge ${p.is_active ? "badge-ready" : "badge-cancelled"}`}>
                                                {p.is_active ? t("products.active") : t("products.inactive")}
                                            </span>
                                        </td>
                                        <td style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                                            <Link to={`/products/${p.id}/edit`} className="btn btn-outline btn-sm">{t("products.edit")}</Link>
                                            <button onClick={() => deleteProduct(p.id, p.name)} className="btn btn-danger btn-sm">{t("products.delete")}</button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
