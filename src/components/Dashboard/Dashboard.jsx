import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import api from "../../api";

export default function Dashboard() {
    const { t } = useTranslation();
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

    if (loading) return <div style={{ padding: 40, color: "#636e72" }}>{t("dashboard.loading")}</div>;

    const statCards = [
        { label: t("dashboard.total_orders"), value: stats?.total || 0, color: "#0984e3" },
        { label: t("dashboard.pending_preorders"), value: stats?.pending || 0, color: "#e17055" },
        { label: t("dashboard.ready_pickup"), value: stats?.ready || 0, color: "#00b894" },
        { label: t("dashboard.delivered"), value: stats?.delivered || 0, color: "#636e72" },
        { label: t("dashboard.pending_dues"), value: stats?.pendingDuesCount || 0, color: "#d63031" },
        { label: t("dashboard.total_due_amount"), value: `₹${stats?.totalDueAmount || 0}`, color: "#d63031" },
    ];

    return (
        <div>
            <div className="topbar">
                <h1>{t("dashboard.title")}</h1>
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
                    <h2>{t("dashboard.recent_orders")}</h2>
                    <Link to="/orders" className="btn btn-outline btn-sm">{t("dashboard.view_all")}</Link>
                </div>
                <div className="table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                <th>{t("dashboard.col_order")}</th>
                                <th>{t("dashboard.col_customer")}</th>
                                <th>{t("dashboard.col_total")}</th>
                                <th>{t("dashboard.col_advance")}</th>
                                <th>{t("dashboard.col_status")}</th>
                                <th>{t("dashboard.col_date")}</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentOrders.length === 0 && (
                                <tr><td colSpan={7} style={{ textAlign: "center", padding: 24, color: "#636e72" }}>{t("dashboard.no_orders")}</td></tr>
                            )}
                            {recentOrders.map((o) => (
                                <tr key={o.id}>
                                    <td><strong>#{o.id}</strong></td>
                                    <td>{o.user?.name}<br /><small style={{ color: "#636e72" }}>{o.user?.phone}</small></td>
                                    <td>₹{parseFloat(o.total_amount).toFixed(2)}</td>
                                    <td>₹{parseFloat(o.advance_paid).toFixed(2)}</td>
                                    <td><span className={`badge ${BADGE[o.order_status] || "badge-pending"}`}>{t(`order_status.${o.order_status}`)}</span></td>
                                    <td>{new Date(o.created_at).toLocaleDateString("en-IN")}</td>
                                    <td><Link to={`/orders/${o.id}`} className="btn btn-outline btn-sm">{t("dashboard.view")}</Link></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

const BADGE = {
    pending: "badge-pending",
    confirmed: "badge-confirmed",
    ready_for_pickup: "badge-ready",
    delivered: "badge-delivered",
    cancelled: "badge-cancelled",
};
