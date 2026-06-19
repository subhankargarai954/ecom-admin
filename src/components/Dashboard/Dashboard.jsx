import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api";

export default function Dashboard() {
    const [stats, setStats] = useState(null);
    const [recentOrders, setRecentOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            api.get("/admin/api/orders?limit=5"),
            api.get("/admin/api/orders/pending-dues"),
        ]).then(([ordersRes, duesRes]) => {
            const orders = ordersRes.data.orders || [];
            setRecentOrders(orders);

            const counts = {
                total: ordersRes.data.total || 0,
                pending: 0, ready: 0, delivered: 0, cancelled: 0,
            };
            orders.forEach((o) => {
                if (o.order_status === "pending" || o.order_status === "confirmed") counts.pending++;
                if (o.order_status === "ready_for_pickup") counts.ready++;
                if (o.order_status === "delivered") counts.delivered++;
                if (o.order_status === "cancelled") counts.cancelled++;
            });

            const dues = duesRes.data.dues || [];
            const totalDue = dues.reduce((sum, d) => sum + parseFloat(d.pending_amount), 0);

            setStats({ ...counts, pendingDuesCount: dues.length, totalDueAmount: totalDue.toFixed(2) });
        }).catch(console.error).finally(() => setLoading(false));
    }, []);

    if (loading) return <div style={{ padding: 40, color: "#636e72" }}>Loading dashboard…</div>;

    const statCards = [
        { label: "Total Orders", value: stats?.total || 0, color: "#0984e3" },
        { label: "Pending / Pre-orders", value: stats?.pending || 0, color: "#e17055" },
        { label: "Ready for Pickup", value: stats?.ready || 0, color: "#00b894" },
        { label: "Delivered", value: stats?.delivered || 0, color: "#636e72" },
        { label: "Pending Dues", value: stats?.pendingDuesCount || 0, color: "#d63031" },
        { label: "Total Due Amount", value: `₹${stats?.totalDueAmount || 0}`, color: "#d63031" },
    ];

    return (
        <div>
            <div className="topbar">
                <h1>Dashboard</h1>
                <span className="topbar-user">{new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</span>
            </div>

            <div className="stats-grid">
                {statCards.map((s) => (
                    <div className="stat-card" key={s.label} style={{ "--accent": s.color }}>
                        <div className="stat-label">{s.label}</div>
                        <div className="stat-value">{s.value}</div>
                    </div>
                ))}
            </div>

            <div className="card">
                <div className="card-header">
                    <h2>Recent Orders</h2>
                    <Link to="/orders" className="btn btn-outline btn-sm">View All</Link>
                </div>
                <div className="table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                <th>Order #</th>
                                <th>Customer</th>
                                <th>Total</th>
                                <th>Advance Paid</th>
                                <th>Status</th>
                                <th>Date</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentOrders.length === 0 && (
                                <tr><td colSpan={7} style={{ textAlign: "center", padding: 24, color: "#636e72" }}>No orders yet</td></tr>
                            )}
                            {recentOrders.map((o) => (
                                <tr key={o.id}>
                                    <td><strong>#{o.id}</strong></td>
                                    <td>{o.user?.name}<br /><small style={{ color: "#636e72" }}>{o.user?.phone}</small></td>
                                    <td>₹{parseFloat(o.total_amount).toFixed(2)}</td>
                                    <td>₹{parseFloat(o.advance_paid).toFixed(2)}</td>
                                    <td><StatusBadge status={o.order_status} /></td>
                                    <td>{new Date(o.created_at).toLocaleDateString("en-IN")}</td>
                                    <td><Link to={`/orders/${o.id}`} className="btn btn-outline btn-sm">View</Link></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

function StatusBadge({ status }) {
    const map = {
        pending: ["badge-pending", "Pending"],
        confirmed: ["badge-confirmed", "Confirmed"],
        ready_for_pickup: ["badge-ready", "Ready"],
        delivered: ["badge-delivered", "Delivered"],
        cancelled: ["badge-cancelled", "Cancelled"],
    };
    const [cls, label] = map[status] || ["badge-pending", status];
    return <span className={`badge ${cls}`}>{label}</span>;
}
