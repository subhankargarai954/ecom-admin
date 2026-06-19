import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api";

const STATUS_TABS = [
    { key: "", label: "All Orders" },
    { key: "pending", label: "Pending" },
    { key: "confirmed", label: "Confirmed" },
    { key: "ready_for_pickup", label: "Ready for Pickup" },
    { key: "delivered", label: "Delivered" },
    { key: "cancelled", label: "Cancelled" },
];

export default function AllOrders() {
    const [orders, setOrders] = useState([]);
    const [total, setTotal] = useState(0);
    const [activeTab, setActiveTab] = useState("");
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const limit = 15;

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page, limit });
            if (activeTab) params.set("status", activeTab);
            const { data } = await api.get(`/admin/api/orders?${params}`);
            setOrders(data.orders || []);
            setTotal(data.total || 0);
        } catch { setError("Failed to load orders."); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchOrders(); }, [activeTab, page]);

    const changeTab = (key) => { setActiveTab(key); setPage(1); };

    return (
        <div>
            <div className="topbar"><h1>Orders</h1></div>
            {error && <div className="alert alert-error">{error}</div>}

            <div className="card">
                <div className="tabs">
                    {STATUS_TABS.map((t) => (
                        <button key={t.key} className={`tab ${activeTab === t.key ? "active" : ""}`}
                            onClick={() => changeTab(t.key)}>{t.label}</button>
                    ))}
                </div>

                {loading ? (
                    <div style={{ padding: 24, color: "#636e72" }}>Loading…</div>
                ) : (
                    <div className="table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th>Order #</th>
                                    <th>Customer</th>
                                    <th>Items</th>
                                    <th>Total</th>
                                    <th>Advance</th>
                                    <th>Payment</th>
                                    <th>Order Status</th>
                                    <th>Delivery Date</th>
                                    <th>Date</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.length === 0 && (
                                    <tr><td colSpan={10}>
                                        <div className="empty-state">
                                            <div className="empty-icon">🛒</div>
                                            <h3>No orders found</h3>
                                        </div>
                                    </td></tr>
                                )}
                                {orders.map((o) => (
                                    <tr key={o.id}>
                                        <td><strong>#{o.id}</strong></td>
                                        <td>
                                            <strong>{o.user?.name}</strong><br />
                                            <small style={{ color: "#636e72" }}>{o.user?.phone}</small>
                                        </td>
                                        <td>{o.items?.length || 0} item(s)</td>
                                        <td><strong>₹{parseFloat(o.total_amount).toFixed(2)}</strong></td>
                                        <td>₹{parseFloat(o.advance_paid).toFixed(2)}</td>
                                        <td><PayBadge status={o.payment_status} /></td>
                                        <td><StatusBadge status={o.order_status} /></td>
                                        <td>
                                            {o.final_delivery_date
                                                ? <strong style={{ color: "#00b894" }}>{fmt(o.final_delivery_date)}</strong>
                                                : o.tentative_delivery_date
                                                    ? <span style={{ color: "#e17055" }}>~{fmt(o.tentative_delivery_date)}</span>
                                                    : "—"}
                                        </td>
                                        <td>{new Date(o.created_at).toLocaleDateString("en-IN")}</td>
                                        <td><Link to={`/orders/${o.id}`} className="btn btn-outline btn-sm">Manage</Link></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {total > limit && (
                    <div className="pagination">
                        <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>‹ Prev</button>
                        <span>Page {page} of {Math.ceil(total / limit)}</span>
                        <button onClick={() => setPage((p) => p + 1)} disabled={page >= Math.ceil(total / limit)}>Next ›</button>
                    </div>
                )}
            </div>
        </div>
    );
}

function fmt(d) { return d ? new Date(d).toLocaleDateString("en-IN") : "—"; }

function StatusBadge({ status }) {
    const map = {
        pending: "badge-pending", confirmed: "badge-confirmed",
        ready_for_pickup: "badge-ready", delivered: "badge-delivered", cancelled: "badge-cancelled",
    };
    const labels = {
        pending: "Pending", confirmed: "Confirmed", ready_for_pickup: "Ready",
        delivered: "Delivered", cancelled: "Cancelled",
    };
    return <span className={`badge ${map[status] || ""}`}>{labels[status] || status}</span>;
}

function PayBadge({ status }) {
    const map = {
        advance_paid: ["badge-advance", "Advance"],
        fully_paid: ["badge-fully-paid", "Paid"],
        pending_after_delivery: ["badge-pending-due", "Due"],
        refunded: ["badge-refunded", "Refunded"],
    };
    const [cls, label] = map[status] || ["", status];
    return <span className={`badge ${cls}`}>{label}</span>;
}
