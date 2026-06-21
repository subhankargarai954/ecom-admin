import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import api from "../../api";

const STATUS_TABS = [
    { key: "", labelKey: "tab_all" },
    { key: "pending", labelKey: "tab_pending" },
    { key: "confirmed", labelKey: "tab_confirmed" },
    { key: "in_production", labelKey: "tab_production" },
    { key: "ready_for_pickup", labelKey: "tab_ready" },
    { key: "delivered", labelKey: "tab_delivered" },
    { key: "cancelled", labelKey: "tab_cancelled" },
];

export default function AllOrders() {
    const { t } = useTranslation();
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

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => { fetchOrders(); }, [activeTab, page]);

    const changeTab = (key) => { setActiveTab(key); setPage(1); };

    return (
        <div>
            <div className="topbar"><h1>{t("orders.title")}</h1></div>
            {error && <div className="alert alert-error">{error}</div>}

            <div className="card">
                <div className="tabs">
                    {STATUS_TABS.map((tab) => (
                        <button key={tab.key} className={`tab ${activeTab === tab.key ? "active" : ""}`}
                            onClick={() => changeTab(tab.key)}>{t(`orders.${tab.labelKey}`)}</button>
                    ))}
                </div>

                {loading ? (
                    <div style={{ padding: 24, color: "var(--text-muted)" }}>{t("orders.loading")}</div>
                ) : (
                    <div className="table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th>{t("orders.col_order")}</th>
                                    <th>{t("orders.col_customer")}</th>
                                    <th>{t("orders.col_items")}</th>
                                    <th>{t("orders.col_total")}</th>
                                    <th>{t("orders.col_advance")}</th>
                                    <th>{t("orders.col_payment")}</th>
                                    <th>{t("orders.col_status")}</th>
                                    <th>{t("orders.col_delivery")}</th>
                                    <th>{t("orders.col_date")}</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.length === 0 && (
                                    <tr><td colSpan={10}>
                                        <div className="empty-state">
                                            <div className="empty-icon">🛒</div>
                                            <h3>{t("orders.none")}</h3>
                                        </div>
                                    </td></tr>
                                )}
                                {orders.map((o) => (
                                    <tr key={o.id}>
                                        <td><strong>#{o.id}</strong></td>
                                        <td>
                                            <strong>{o.user?.name}</strong><br />
                                            <small style={{ color: "var(--text-muted)" }}>{o.user?.phone}</small>
                                        </td>
                                        <td>{t("orders.items_count", { count: o.items?.length || 0 })}</td>
                                        <td><strong>₹{parseFloat(o.total_amount).toFixed(2)}</strong></td>
                                        <td>{advanceCell(o, t)}</td>
                                        <td><span className={`badge ${PAY_BADGE[o.payment_status] || ""}`}>{t(`payment_status.${o.payment_status}`)}</span></td>
                                        <td><span className={`badge ${STATUS_BADGE[o.order_status] || ""}`}>{t(`order_status.${o.order_status}`)}</span></td>
                                        <td>
                                            {o.final_delivery_date
                                                ? <strong style={{ color: "var(--ok)" }}>{fmt(o.final_delivery_date)}</strong>
                                                : o.tentative_delivery_date
                                                    ? <span style={{ color: "var(--warn)" }}>~{fmt(o.tentative_delivery_date)}</span>
                                                    : "—"}
                                        </td>
                                        <td>{new Date(o.created_at).toLocaleDateString("en-IN")}</td>
                                        <td><Link to={`/orders/${o.id}`} className="btn btn-outline btn-sm">{t("orders.manage")}</Link></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {total > limit && (
                    <div className="pagination">
                        <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>‹ {t("orders.prev")}</button>
                        <span>{t("orders.page_of", { page, total: Math.ceil(total / limit) })}</span>
                        <button onClick={() => setPage((p) => p + 1)} disabled={page >= Math.ceil(total / limit)}>{t("orders.next")} ›</button>
                    </div>
                )}
            </div>
        </div>
    );
}

function fmt(d) { return d ? new Date(d).toLocaleDateString("en-IN") : "—"; }

// Advance cell: green once received; amber "to collect" while the advance
// payment is still pending; muted ₹0 otherwise.
function advanceCell(o, t) {
    if (parseFloat(o.advance_paid) > 0)
        return <span style={{ color: "var(--ok)", fontWeight: 600 }}>₹{parseFloat(o.advance_paid).toFixed(2)}</span>;
    const pending = (o.payments || []).find((p) => p.payment_type === "advance" && p.status === "pending");
    if (pending)
        return <span style={{ color: "var(--warn)", fontWeight: 700 }} title={t("orders.advance_to_collect")}>₹{parseFloat(pending.amount).toFixed(2)} •</span>;
    return <span style={{ color: "var(--text-muted)" }}>₹0.00</span>;
}

const STATUS_BADGE = {
    awaiting_payment: "badge-pending", pending: "badge-pending", confirmed: "badge-confirmed",
    in_production: "badge-confirmed", ready_for_pickup: "badge-ready",
    delivered: "badge-delivered", cancelled: "badge-cancelled",
};

const PAY_BADGE = {
    advance_paid: "badge-advance",
    fully_paid: "badge-fully-paid",
    pending_after_delivery: "badge-pending-due",
    refunded: "badge-refunded",
};
