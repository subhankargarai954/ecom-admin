import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api";

export default function AllProducts() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");

    const fetchProducts = async () => {
        try {
            const { data } = await api.get("/admin/api/products");
            setProducts(data.products || []);
        } catch (err) {
            setError("Failed to load products.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchProducts(); }, []);

    const deleteProduct = async (id, name) => {
        if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
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

    if (loading) return <div style={{ padding: 40, color: "#636e72" }}>Loading products…</div>;

    return (
        <div>
            <div className="topbar">
                <h1>Products</h1>
                <Link to="/products/new" className="btn btn-primary">+ Add Product</Link>
            </div>
            {error && <div className="alert alert-error">{error}</div>}
            <div className="card">
                <div className="card-header">
                    <h2>{products.length} Products</h2>
                    <input
                        type="text"
                        placeholder="Search products…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{ padding: "7px 12px", border: "1px solid #dfe6e9", borderRadius: 6, fontSize: 13, width: 220 }}
                    />
                </div>
                <div className="table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                <th>Image</th>
                                <th>Name</th>
                                <th>Category</th>
                                <th>Price</th>
                                <th>Discount</th>
                                <th>Stock</th>
                                <th>Variants</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 && (
                                <tr><td colSpan={9}>
                                    <div className="empty-state">
                                        <div className="empty-icon">📦</div>
                                        <h3>No products found</h3>
                                        <p>Add your first product to get started.</p>
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
                                        <td><strong>{p.name}</strong></td>
                                        <td>{p.category?.name || "—"}</td>
                                        <td>
                                            ₹{effectivePrice.toFixed(2)}
                                            {parseFloat(p.discount_percent) > 0 && (
                                                <small style={{ color: "#636e72", display: "block" }}>MRP ₹{parseFloat(p.base_price).toFixed(2)}</small>
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
                                                {p.is_active ? "Active" : "Inactive"}
                                            </span>
                                        </td>
                                        <td style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                                            <Link to={`/products/${p.id}/edit`} className="btn btn-outline btn-sm">Edit</Link>
                                            <button onClick={() => deleteProduct(p.id, p.name)} className="btn btn-danger btn-sm">Delete</button>
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
