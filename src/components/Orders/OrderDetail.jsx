import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import api from "../../api";

const STEPS = ["pending", "confirmed", "ready_for_pickup", "delivered"];

export default function OrderDetail() {
    const { t } = useTranslation();
    const { id } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // Modals
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [showDeliveryDateModal, setShowDeliveryDateModal] = useState(false);
    const [showDeliverModal, setShowDeliverModal] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);

    // Form state
    const [confirmForm, setConfirmForm] = useState({ tentative_delivery_date: "", admin_notes: "" });
    const [deliveryDate, setDeliveryDate] = useState("");
    const [deliverForm, setDeliverForm] = useState({ final_paid: "", final_payment_mode: "cash" });
    const [cancelReason, setCancelReason] = useState("");
    const [actionLoading, setActionLoading] = useState(false);

    const fetchOrder = async () => {
        try {
            const { data } = await api.get(`/admin/api/orders/${id}`);
            setOrder(data.order);
        } catch { setError("Failed to load order."); }
        finally { setLoading(false); }
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => { fetchOrder(); }, [id]);

    const doAction = async (fn) => {
        setActionLoading(true); setError(""); setSuccess("");
        try { await fn(); await fetchOrder(); }
        catch (err) { setError(err.response?.data?.error || "Action failed."); }
        finally { setActionLoading(false); }
    };

    const handleConfirm = () => doAction(async () => {
        await api.put(`/admin/api/orders/${id}/confirm`, confirmForm);
        setSuccess("✓"); setShowConfirmModal(false);
    });

    const handleSetDeliveryDate = () => doAction(async () => {
        await api.put(`/admin/api/orders/${id}/delivery-date`, { final_delivery_date: deliveryDate });
        setSuccess("✓"); setShowDeliveryDateModal(false);
    });

    const handleDeliver = () => doAction(async () => {
        const { data } = await api.put(`/admin/api/orders/${id}/deliver`, deliverForm);
        setSuccess(`✓ ${data.pending_amount > 0 ? `₹${data.pending_amount}` : ""}`.trim());
        setShowDeliverModal(false);
    });

    const handleCancel = () => doAction(async () => {
        await api.put(`/admin/api/orders/${id}/cancel`, { cancellation_reason: cancelReason });
        setSuccess("✓"); setShowCancelModal(false);
    });

    const handleMarkRefund = () => doAction(async () => {
        await api.put(`/admin/api/orders/${id}/refund`);
        setSuccess("✓");
    });

    if (loading) return <div style={{ padding: 40, color: "var(--text-muted)" }}>{t("order_detail.loading")}</div>;
    if (!order) return <div className="alert alert-error">{t("order_detail.not_found")}</div>;

    const stepIdx = STEPS.indexOf(order.order_status);
    const pending_amount = Math.max(0,
        parseFloat(order.total_amount) - parseFloat(order.advance_paid) - parseFloat(order.final_paid)
    ).toFixed(2);

    return (
        <div>
            <div className="topbar">
                <h1>{t("order_detail.title")} #{order.id}</h1>
                <button className="btn btn-outline" onClick={() => navigate("/orders")}>← {t("order_detail.back")}</button>
            </div>

            {error && <div className="alert alert-error">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}

            {/* Status Timeline */}
            {order.order_status !== "cancelled" && (
                <div className="card" style={{ marginBottom: 16 }}>
                    <div className="order-timeline">
                        {STEPS.map((s, i) => (
                            <div key={s} className={`timeline-step ${i < stepIdx ? "done" : i === stepIdx ? "active" : ""}`}>
                                <div className="timeline-dot">{i < stepIdx ? "✓" : i + 1}</div>
                                <div className="timeline-label">{t(`order_status.${s}`)}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {order.order_status === "cancelled" && (
                <div className="alert alert-error">
                    <strong>{t("order_detail.cancelled_label")}</strong>{order.cancellation_reason ? ` — ${order.cancellation_reason}` : ""}
                </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                {/* Customer Info */}
                <div className="card">
                    <div className="card-header"><h2>{t("order_detail.customer")}</h2></div>
                    <p><strong>{order.user?.name}</strong></p>
                    <p style={{ color: "var(--text-muted)", fontSize: 13 }}>📞 {order.user?.phone}</p>
                    {order.user?.email && <p style={{ color: "var(--text-muted)", fontSize: 13 }}>✉️ {order.user.email}</p>}
                    {order.user?.address && <p style={{ color: "var(--text-muted)", fontSize: 13 }}>📍 {order.user.address}</p>}
                </div>

                {/* Payment Info */}
                <div className="card">
                    <div className="card-header"><h2>{t("order_detail.payment")}</h2></div>
                    <table style={{ width: "100%", fontSize: 13 }}>
                        <tbody>
                            <tr><td style={{ padding: "4px 0", color: "var(--text-muted)" }}>{t("order_detail.order_total")}</td><td style={{ textAlign: "right", fontWeight: 600 }}>₹{parseFloat(order.total_amount).toFixed(2)}</td></tr>
                            <tr><td style={{ padding: "4px 0", color: "var(--text-muted)" }}>{t("order_detail.advance_paid")} ({order.advance_payment_mode})</td><td style={{ textAlign: "right", color: "var(--ok)", fontWeight: 600 }}>₹{parseFloat(order.advance_paid).toFixed(2)}</td></tr>
                            {parseFloat(order.final_paid) > 0 && (
                                <tr><td style={{ padding: "4px 0", color: "var(--text-muted)" }}>{t("order_detail.final_paid")} ({order.final_payment_mode})</td><td style={{ textAlign: "right", color: "var(--ok)", fontWeight: 600 }}>₹{parseFloat(order.final_paid).toFixed(2)}</td></tr>
                            )}
                            <tr style={{ borderTop: "1px solid var(--border)" }}>
                                <td style={{ padding: "8px 0 4px", fontWeight: 700 }}>{t("order_detail.pending_due")}</td>
                                <td style={{ textAlign: "right", fontWeight: 700, color: parseFloat(pending_amount) > 0 ? "var(--bad)" : "var(--ok)" }}>
                                    ₹{pending_amount}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                    <div style={{ marginTop: 8 }}>
                        <span className={`badge ${PAY_BADGE[order.payment_status] || ""}`}>{t(`payment_status.${order.payment_status}`)}</span>
                    </div>
                </div>

                {/* Delivery Info */}
                <div className="card">
                    <div className="card-header"><h2>{t("order_detail.delivery")}</h2></div>
                    <table style={{ width: "100%", fontSize: 13 }}>
                        <tbody>
                            <tr><td style={{ padding: "4px 0", color: "var(--text-muted)" }}>{t("order_detail.all_available")}</td>
                                <td style={{ textAlign: "right" }}><span className={`badge ${order.all_items_available ? "badge-ready" : "badge-warning"}`}>{order.all_items_available ? t("order_detail.yes") : t("order_detail.no_preorder")}</span></td></tr>
                            {order.tentative_delivery_date && (
                                <tr><td style={{ padding: "4px 0", color: "var(--text-muted)" }}>{t("order_detail.tentative_date")}</td>
                                    <td style={{ textAlign: "right", color: "var(--warn)" }}>~{fmt(order.tentative_delivery_date)}</td></tr>
                            )}
                            {order.final_delivery_date && (
                                <tr><td style={{ padding: "4px 0", color: "var(--text-muted)" }}>{t("order_detail.final_delivery_date")}</td>
                                    <td style={{ textAlign: "right", color: "var(--ok)", fontWeight: 700 }}>{fmt(order.final_delivery_date)}</td></tr>
                            )}
                            {order.actual_delivery_date && (
                                <tr><td style={{ padding: "4px 0", color: "var(--text-muted)" }}>{t("order_detail.collected_on")}</td>
                                    <td style={{ textAlign: "right", fontWeight: 600 }}>{new Date(order.actual_delivery_date).toLocaleString("en-IN")}</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Actions */}
                <div className="card">
                    <div className="card-header"><h2>{t("order_detail.actions")}</h2></div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {order.order_status === "pending" && !order.all_items_available && (
                            <button className="btn btn-primary" onClick={() => setShowConfirmModal(true)}>
                                ✅ {t("order_detail.confirm_preorder")}
                            </button>
                        )}
                        {["pending", "confirmed"].includes(order.order_status) && (
                            <button className="btn btn-success" onClick={() => setShowDeliveryDateModal(true)}>
                                📅 {t("order_detail.set_final_date")}
                            </button>
                        )}
                        {order.order_status === "ready_for_pickup" && (
                            <button className="btn btn-primary" onClick={() => setShowDeliverModal(true)}>
                                🎉 {t("order_detail.mark_delivered")}
                            </button>
                        )}
                        {order.order_status === "cancelled" && order.payment_status !== "refunded" && (
                            <button className="btn btn-secondary" onClick={handleMarkRefund}>
                                💵 {t("order_detail.mark_refund")}
                            </button>
                        )}
                        {!["delivered", "cancelled"].includes(order.order_status) && (
                            <button className="btn btn-danger" onClick={() => setShowCancelModal(true)}>
                                ✕ {t("order_detail.cancel_order")}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Order Items */}
            <div className="card" style={{ marginTop: 8 }}>
                <div className="card-header"><h2>{t("order_detail.items")}</h2></div>
                <div className="table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                <th>{t("order_detail.col_product")}</th>
                                <th>{t("order_detail.col_variant")}</th>
                                <th>{t("order_detail.col_unit_price")}</th>
                                <th>{t("order_detail.col_discount")}</th>
                                <th>{t("order_detail.col_qty")}</th>
                                <th>{t("order_detail.col_subtotal")}</th>
                                <th>{t("order_detail.col_in_stock")}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {order.items?.map((item) => {
                                const effective = parseFloat(item.unit_price) * (1 - parseFloat(item.discount_percent || 0) / 100);
                                const subtotal = effective * item.quantity;
                                return (
                                    <tr key={item.id}>
                                        <td><strong>{item.product?.name}</strong></td>
                                        <td>{item.variant?.variant_name || "—"}</td>
                                        <td>₹{parseFloat(item.unit_price).toFixed(2)}</td>
                                        <td>{item.discount_percent > 0 ? `${item.discount_percent}%` : "—"}</td>
                                        <td>{item.quantity}</td>
                                        <td><strong>₹{subtotal.toFixed(2)}</strong></td>
                                        <td>
                                            <span className={`badge ${item.was_available_at_order ? "badge-ready" : "badge-pending"}`}>
                                                {item.was_available_at_order ? t("order_detail.in_stock") : t("order_detail.preorder")}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modals */}
            {showConfirmModal && (
                <Modal title={t("order_detail.modal_confirm_title")} onClose={() => setShowConfirmModal(false)}>
                    <div className="form-group" style={{ marginBottom: 12 }}>
                        <label>{t("order_detail.modal_tentative_label")}</label>
                        <input type="date" value={confirmForm.tentative_delivery_date}
                            onChange={(e) => setConfirmForm({ ...confirmForm, tentative_delivery_date: e.target.value })} />
                    </div>
                    <div className="form-group" style={{ marginBottom: 16 }}>
                        <label>{t("order_detail.modal_admin_notes")}</label>
                        <textarea value={confirmForm.admin_notes}
                            onChange={(e) => setConfirmForm({ ...confirmForm, admin_notes: e.target.value })}
                            placeholder={t("order_detail.modal_admin_notes_placeholder")} rows={2} />
                    </div>
                    <div className="modal-actions">
                        <button className="btn btn-outline" onClick={() => setShowConfirmModal(false)}>{t("order_detail.modal_cancel")}</button>
                        <button className="btn btn-primary" onClick={handleConfirm} disabled={actionLoading}>{t("order_detail.modal_confirm_btn")}</button>
                    </div>
                </Modal>
            )}

            {showDeliveryDateModal && (
                <Modal title={t("order_detail.modal_final_title")} onClose={() => setShowDeliveryDateModal(false)}>
                    <div className="form-group" style={{ marginBottom: 16 }}>
                        <label>{t("order_detail.modal_final_label")} *</label>
                        <input type="date" value={deliveryDate}
                            onChange={(e) => setDeliveryDate(e.target.value)} required />
                    </div>
                    <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
                        {t("order_detail.modal_final_note")}
                    </p>
                    <div className="modal-actions">
                        <button className="btn btn-outline" onClick={() => setShowDeliveryDateModal(false)}>{t("order_detail.modal_cancel")}</button>
                        <button className="btn btn-success" onClick={handleSetDeliveryDate} disabled={actionLoading || !deliveryDate}>{t("order_detail.modal_confirm_date")}</button>
                    </div>
                </Modal>
            )}

            {showDeliverModal && (
                <Modal title={t("order_detail.modal_deliver_title")} onClose={() => setShowDeliverModal(false)}>
                    <div className="alert alert-info">
                        {t("order_detail.modal_deliver_summary", {
                            total: `₹${parseFloat(order.total_amount).toFixed(2)}`,
                            advance: `₹${parseFloat(order.advance_paid).toFixed(2)}`,
                            due: `₹${pending_amount}`,
                        })}
                    </div>
                    <div className="form-group" style={{ marginBottom: 12 }}>
                        <label>{t("order_detail.modal_final_received")}</label>
                        <input type="number" step="0.01" min="0"
                            value={deliverForm.final_paid}
                            onChange={(e) => setDeliverForm({ ...deliverForm, final_paid: e.target.value })}
                            placeholder={t("order_detail.modal_max", { amount: pending_amount })} />
                    </div>
                    <div className="form-group" style={{ marginBottom: 16 }}>
                        <label>{t("order_detail.modal_payment_mode")}</label>
                        <select value={deliverForm.final_payment_mode}
                            onChange={(e) => setDeliverForm({ ...deliverForm, final_payment_mode: e.target.value })}>
                            <option value="cash">{t("order_detail.cash")}</option>
                            <option value="online">{t("order_detail.online")}</option>
                            <option value="mixed">{t("order_detail.mixed")}</option>
                        </select>
                    </div>
                    <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
                        {t("order_detail.modal_deliver_note")}
                    </p>
                    <div className="modal-actions">
                        <button className="btn btn-outline" onClick={() => setShowDeliverModal(false)}>{t("order_detail.modal_cancel")}</button>
                        <button className="btn btn-primary" onClick={handleDeliver} disabled={actionLoading}>{t("order_detail.modal_deliver_btn")}</button>
                    </div>
                </Modal>
            )}

            {showCancelModal && (
                <Modal title={t("order_detail.modal_cancel_title")} onClose={() => setShowCancelModal(false)}>
                    <div className="alert alert-error">{t("order_detail.modal_cancel_warning")}</div>
                    <div className="form-group" style={{ marginBottom: 16 }}>
                        <label>{t("order_detail.modal_cancel_reason")}</label>
                        <textarea value={cancelReason} onChange={(e) => setCancelReason(e.target.value)}
                            placeholder={t("order_detail.modal_cancel_reason_placeholder")} rows={2} />
                    </div>
                    <div className="modal-actions">
                        <button className="btn btn-outline" onClick={() => setShowCancelModal(false)}>{t("order_detail.modal_back")}</button>
                        <button className="btn btn-danger" onClick={handleCancel} disabled={actionLoading}>{t("order_detail.modal_cancel_btn")}</button>
                    </div>
                </Modal>
            )}
        </div>
    );
}

function Modal({ title, children, onClose }) {
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
                <h3>{title}</h3>
                {children}
            </div>
        </div>
    );
}

function fmt(d) { return d ? new Date(d).toLocaleDateString("en-IN") : "—"; }

const PAY_BADGE = {
    advance_paid: "badge-advance",
    fully_paid: "badge-fully-paid",
    pending_after_delivery: "badge-pending-due",
    refunded: "badge-refunded",
};
