import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import api from "../../api";

export default function OrderDetail() {
    const { t } = useTranslation();
    const { id } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [messages, setMessages] = useState([]);
    const [msgLive, setMsgLive] = useState(false);

    // Modals
    const [showProductionModal, setShowProductionModal] = useState(false);
    const [showReadyModal, setShowReadyModal] = useState(false);
    const [showDeliverModal, setShowDeliverModal] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);

    // Form state
    const [productionForm, setProductionForm] = useState({ tentative_delivery_date: "", admin_notes: "" });
    const [readyDate, setReadyDate] = useState("");
    const [deliverForm, setDeliverForm] = useState({ final_paid: "", final_payment_mode: "cash" });
    const [payFullDue, setPayFullDue] = useState(false);
    const [cancelReason, setCancelReason] = useState("");
    const [actionLoading, setActionLoading] = useState(false);

    const fetchOrder = async () => {
        try {
            const { data } = await api.get(`/admin/api/orders/${id}`);
            setOrder(data.order);
        } catch { setError("Failed to load order."); }
        finally { setLoading(false); }
    };

    const fetchMessages = async () => {
        try {
            const { data } = await api.get(`/admin/api/orders/${id}/messages`);
            setMessages(data.messages || []);
            setMsgLive(!!data.live);
        } catch { /* messages are non-critical */ }
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => { fetchOrder(); fetchMessages(); }, [id]);

    const handleResend = (event) => doAction(async () => {
        await api.post(`/admin/api/orders/${id}/resend`, { event });
        await fetchMessages();
        setSuccess("✓");
    });

    const doAction = async (fn) => {
        setActionLoading(true); setError(""); setSuccess("");
        try { await fn(); await fetchOrder(); }
        catch (err) { setError(err.response?.data?.error || "Action failed."); }
        finally { setActionLoading(false); }
    };

    // Confirm a CASH advance was received → order placed & stock reserved.
    const handleConfirmAdvance = () => doAction(async () => {
        await api.put(`/admin/api/orders/${id}/confirm-advance`);
        setSuccess("✓");
    });

    // Confirm a customer's cash due request → clears the balance.
    const handleConfirmDue = () => doAction(async () => {
        await api.put(`/admin/api/orders/${id}/confirm-due`);
        setSuccess("✓");
    });
    // Reject the cash request → customer can choose a payment option again.
    const handleRejectDue = () => doAction(async () => {
        await api.put(`/admin/api/orders/${id}/reject-due`);
        setSuccess("✓");
    });

    const handleStartProduction = () => doAction(async () => {
        await api.put(`/admin/api/orders/${id}/production`, productionForm);
        setSuccess("✓"); setShowProductionModal(false);
    });

    const handleMarkReady = () => doAction(async () => {
        await api.put(`/admin/api/orders/${id}/ready`, { final_delivery_date: readyDate });
        setSuccess("✓"); setShowReadyModal(false);
    });

    const handleDeliver = () => doAction(async () => {
        const { data } = await api.put(`/admin/api/orders/${id}/deliver`, deliverForm);
        setSuccess(`✓ ${data.pending_amount > 0 ? `₹${data.pending_amount}` : ""}`.trim());
        setShowDeliverModal(false);
    });

    // Balance due as a string (used to cap the final-payment input).
    const dueAmount = () => order
        ? Math.max(0, parseFloat(order.total_amount) - parseFloat(order.advance_paid) - parseFloat(order.final_paid)).toFixed(2)
        : "0.00";
    // Default the ready-date picker to the tentative delivery date.
    const openReady = () => {
        setReadyDate(order?.tentative_delivery_date ? String(order.tentative_delivery_date).slice(0, 10) : "");
        setShowReadyModal(true);
    };
    const openDeliver = () => {
        // Default to collecting the full balance (checkbox pre-checked).
        setDeliverForm({ final_paid: dueAmount(), final_payment_mode: "cash" });
        setPayFullDue(true);
        setShowDeliverModal(true);
    };
    // Clamp entry to the balance due; sync the "pay full due" checkbox.
    const onFinalPaidChange = (e) => {
        let v = e.target.value;
        const max = parseFloat(dueAmount());
        const num = parseFloat(v);
        if (!isNaN(num) && num > max) v = String(max);
        setDeliverForm((f) => ({ ...f, final_paid: v }));
        const n2 = parseFloat(v);
        setPayFullDue(!isNaN(n2) && Math.abs(n2 - max) < 0.01);
    };
    const onToggleFullDue = (e) => {
        if (e.target.checked) {
            setDeliverForm((f) => ({ ...f, final_paid: dueAmount() }));
            setPayFullDue(true);
        } else {
            setDeliverForm((f) => ({ ...f, final_paid: "" }));
            setPayFullDue(false);
        }
    };

    // Add manufactured units to a product/variant's on-hand stock.
    const handleAddStock = async (productId, variantId, quantity) => {
        await api.post(`/admin/api/products/${productId}/add-stock`, { quantity, variant_id: variantId || null });
        await fetchOrder();
        setSuccess("✓");
    };

    const handleCancel = () => doAction(async () => {
        await api.put(`/admin/api/orders/${id}/cancel`, { cancellation_reason: cancelReason });
        setSuccess("✓"); setShowCancelModal(false);
    });

    const handleMarkRefund = () => doAction(async () => {
        await api.put(`/admin/api/orders/${id}/refund`);
        setSuccess("✓");
    });

    const getInvoiceBlobUrl = async () => {
        const res = await api.get(`/admin/api/orders/${id}/invoice.pdf`, { responseType: "blob" });
        return window.URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
    };
    const downloadInvoice = async () => {
        try {
            const url = await getInvoiceBlobUrl();
            const a = document.createElement("a");
            a.href = url; a.download = `invoice-${order.invoice_no || order.id}.pdf`; a.click();
            window.URL.revokeObjectURL(url);
        } catch { alert("Could not download invoice."); }
    };
    const viewInvoice = async () => {
        try { window.open(await getInvoiceBlobUrl(), "_blank"); }
        catch { alert("Could not open invoice."); }
    };

    if (loading) return <div style={{ padding: 40, color: "var(--text-muted)" }}>{t("order_detail.loading")}</div>;
    if (!order) return <div className="alert alert-error">{t("order_detail.not_found")}</div>;

    const { steps: tlSteps } = buildTimeline(order);
    const preConfirm = ["awaiting_payment", "pending"].includes(order.order_status);
    const pending_amount = Math.max(0,
        parseFloat(order.total_amount) - parseFloat(order.advance_paid) - parseFloat(order.final_paid)
    ).toFixed(2);
    // For an unconfirmed (cash/awaiting) order, the committed advance lives on the
    // pending Payment record until it's confirmed onto order.advance_paid.
    const pendingAdvance = (order.payments || []).find(
        (p) => p.payment_type === "advance" && p.status === "pending"
    );
    // A customer cash due request awaiting admin confirmation.
    const cashDueRequested = (order.payments || []).find(
        (p) => p.payment_type === "final" && p.status === "pending" && p.method === "cash"
    );
    // On-hand stock must cover every item before the order can be marked ready.
    const onHandOf = (it) => (it.variant ? it.variant.available_quantity : it.product?.available_quantity) || 0;
    const canMarkReady = (order.items || []).every((it) => onHandOf(it) >= it.quantity);
    const canEditStock = ["confirmed", "in_production"].includes(order.order_status);

    return (
        <div>
            <div className="topbar">
                <h1>{t("order_detail.title")} #{order.id}</h1>
                <button className="btn btn-outline" onClick={() => navigate("/orders")}>← {t("order_detail.back")}</button>
            </div>

            {error && <div className="alert alert-error">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}

            {/* Pre-confirmation banner */}
            {preConfirm && (
                <div className="alert alert-info">
                    {order.order_status === "pending"
                        ? "💵 " + t("actions2.confirm_advance_hint")
                        : "💳 Customer is completing online payment."}
                </div>
            )}

            {/* Status Timeline — full lifecycle; completed steps are green */}
            {order.order_status !== "cancelled" && (
                <div className="card" style={{ marginBottom: 16 }}>
                    <div className="order-timeline">
                        {tlSteps.map((st, i) => (
                            <div key={st.key} className={`timeline-step ${st.done ? "done" : st.active ? "active" : ""}`}>
                                <div className="timeline-dot">{st.done ? "✓" : i + 1}</div>
                                <div className="timeline-label">{t(`timeline.${st.key}`)}</div>
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
                            <tr><td style={{ padding: "4px 0", color: "var(--text-muted)" }}>{t("order_detail.advance_paid")} ({order.advance_payment_mode})</td><td style={{ textAlign: "right", color: parseFloat(order.advance_paid) > 0 ? "var(--ok)" : "var(--text-muted)", fontWeight: 600 }}>₹{parseFloat(order.advance_paid).toFixed(2)}</td></tr>
                            {pendingAdvance && (
                                <tr><td style={{ padding: "4px 0", color: "var(--warn)" }}>{t("order_detail.advance_to_collect")} ({pendingAdvance.method})</td>
                                    <td style={{ textAlign: "right", color: "var(--warn)", fontWeight: 700 }}>₹{parseFloat(pendingAdvance.amount).toFixed(2)} <span className="badge badge-pending" style={{ marginLeft: 4 }}>{t("order_detail.advance_pending")}</span></td></tr>
                            )}
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
                        {order.order_status === "pending" && (
                            <button className="btn btn-success" onClick={handleConfirmAdvance} disabled={actionLoading}>
                                ✅ {t("actions2.confirm_advance")}{pendingAdvance ? ` — ₹${parseFloat(pendingAdvance.amount).toFixed(2)}` : ""}
                            </button>
                        )}
                        {cashDueRequested && (
                            <>
                                <button className="btn btn-success" onClick={handleConfirmDue} disabled={actionLoading}>
                                    💵 {t("order_detail.confirm_cash_due", { amount: `₹${parseFloat(cashDueRequested.amount).toFixed(2)}` })}
                                </button>
                                <button className="btn btn-danger" onClick={handleRejectDue} disabled={actionLoading}>
                                    ✕ {t("order_detail.reject_cash_due")}
                                </button>
                            </>
                        )}
                        {["confirmed", "in_production"].includes(order.order_status) && order.is_made_to_order && (
                            <button className="btn btn-warning" onClick={() => setShowProductionModal(true)}>
                                🏭 {t("actions2.start_production")}
                            </button>
                        )}
                        {["confirmed", "in_production"].includes(order.order_status) && (
                            <>
                                <button className="btn btn-success" onClick={openReady} disabled={!canMarkReady}>
                                    📦 {t("actions2.mark_ready")}
                                </button>
                                {!canMarkReady && (
                                    <small style={{ color: "var(--warn)", marginTop: -4 }}>⚠ {t("order_detail.stock_needed_hint")}</small>
                                )}
                            </>
                        )}
                        {order.order_status === "ready_for_pickup" && (
                            <button className="btn btn-primary" onClick={openDeliver}>
                                🎉 {t("order_detail.mark_delivered")}
                            </button>
                        )}
                        {order.order_status === "delivered" && (
                            <>
                                <button className="btn btn-outline" onClick={viewInvoice}>🧾 {t("actions2.view_invoice")}</button>
                                <button className="btn btn-outline" onClick={downloadInvoice}>⬇ {t("actions2.download_pdf")}</button>
                            </>
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
                                <th>{t("order_detail.col_on_hand")}</th>
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
                                        <td>
                                            <StockCell item={item} t={t} canEdit={canEditStock} onAdd={handleAddStock} />
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Customer Notifications (SMS / WhatsApp) */}
            <div className="card" style={{ marginTop: 8 }}>
                <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <h2>{t("messages.title")}</h2>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        {!msgLive && <span className="badge badge-warning">{t("messages.sim_mode")}</span>}
                        {order.order_status === "delivered" && (
                            <button className="btn btn-outline btn-sm" onClick={() => handleResend("order_completed")} disabled={actionLoading}>
                                🔁 {t("messages.resend_bill")}
                            </button>
                        )}
                    </div>
                </div>
                {messages.length === 0 ? (
                    <p style={{ color: "var(--text-muted)", fontSize: 13 }}>{t("messages.none")}</p>
                ) : (
                    <div className="table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th>{t("messages.col_time")}</th>
                                    <th>{t("messages.col_channel")}</th>
                                    <th>{t("messages.col_event")}</th>
                                    <th>{t("messages.col_status")}</th>
                                    <th>{t("messages.col_message")}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {messages.map((m) => (
                                    <tr key={m.id}>
                                        <td style={{ whiteSpace: "nowrap", fontSize: 12 }}>{new Date(m.created_at).toLocaleString("en-IN")}</td>
                                        <td>{m.channel === "whatsapp" ? "🟢 WhatsApp" : "✉️ SMS"}</td>
                                        <td style={{ fontSize: 12 }}>{t(`messages.event.${m.event}`, m.event)}</td>
                                        <td>
                                            <span className={`badge ${m.status === "sent" ? "badge-ready" : m.status === "failed" ? "badge-pending-due" : "badge-warning"}`}>
                                                {t(`messages.status.${m.status}`, m.status)}
                                            </span>
                                        </td>
                                        <td style={{ fontSize: 12, color: "var(--text-muted)", maxWidth: 320, whiteSpace: "pre-wrap" }}>
                                            {m.body?.slice(0, 140)}{m.body?.length > 140 ? "…" : ""}
                                            {m.media ? <div style={{ color: "var(--accent)", marginTop: 4 }}>📎 {JSON.parse(m.media).length} attachment(s)</div> : null}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modals */}
            {showProductionModal && (
                <Modal title={t("actions2.start_production")} onClose={() => setShowProductionModal(false)}>
                    <div className="form-group" style={{ marginBottom: 12 }}>
                        <label>{t("actions2.tentative_ready")}</label>
                        <input type="date" value={productionForm.tentative_delivery_date}
                            onChange={(e) => setProductionForm({ ...productionForm, tentative_delivery_date: e.target.value })} />
                    </div>
                    <div className="form-group" style={{ marginBottom: 16 }}>
                        <label>{t("order_detail.modal_admin_notes")}</label>
                        <textarea value={productionForm.admin_notes}
                            onChange={(e) => setProductionForm({ ...productionForm, admin_notes: e.target.value })}
                            placeholder={t("order_detail.modal_admin_notes_placeholder")} rows={2} />
                    </div>
                    <div className="modal-actions">
                        <button className="btn btn-outline" onClick={() => setShowProductionModal(false)}>{t("order_detail.modal_cancel")}</button>
                        <button className="btn btn-warning" onClick={handleStartProduction} disabled={actionLoading}>{t("actions2.start_production")}</button>
                    </div>
                </Modal>
            )}

            {showReadyModal && (
                <Modal title={t("actions2.mark_ready")} onClose={() => setShowReadyModal(false)}>
                    <div className="form-group" style={{ marginBottom: 16 }}>
                        <label>{t("actions2.ready_date")}</label>
                        <input type="date" value={readyDate} onChange={(e) => setReadyDate(e.target.value)} />
                        <small style={{ color: "var(--text-muted)", fontSize: 12 }}>Leave blank to use today.</small>
                    </div>
                    <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
                        {t("order_detail.modal_final_note")}
                    </p>
                    <div className="modal-actions">
                        <button className="btn btn-outline" onClick={() => setShowReadyModal(false)}>{t("order_detail.modal_cancel")}</button>
                        <button className="btn btn-success" onClick={handleMarkReady} disabled={actionLoading}>{t("actions2.mark_ready")}</button>
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
                        <input type="number" step="0.01" min="0" max={pending_amount}
                            value={deliverForm.final_paid}
                            onChange={onFinalPaidChange}
                            placeholder={t("order_detail.modal_max", { amount: pending_amount })} />
                        <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10, fontSize: 13, cursor: "pointer", fontWeight: 500 }}>
                            <input type="checkbox" checked={payFullDue} onChange={onToggleFullDue} style={{ width: "auto", margin: 0 }} />
                            {t("order_detail.pay_full_due", { amount: `₹${pending_amount}` })}
                        </label>
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

// Shows on-hand stock for an order item and, when short, an inline
// "+ Add stock" control to add manufactured units to the product/variant.
function StockCell({ item, t, canEdit, onAdd }) {
    const onHand = (item.variant ? item.variant.available_quantity : item.product?.available_quantity) || 0;
    const short = Math.max(0, item.quantity - onHand);
    const [qty, setQty] = useState(short || 1);
    const [busy, setBusy] = useState(false);
    useEffect(() => { setQty(short || 1); }, [short]);

    const add = async () => {
        const n = parseInt(qty, 10);
        if (!n || n <= 0) return;
        setBusy(true);
        try { await onAdd(item.product.id, item.variant?.id, n); }
        catch (e) { alert(e.response?.data?.error || "Failed to add stock."); }
        finally { setBusy(false); }
    };

    return (
        <div>
            <div style={{ fontWeight: 600, color: short > 0 ? "var(--bad)" : "var(--ok)" }}>
                {onHand}{short > 0 ? ` · ${t("order_detail.short_by", { n: short })}` : " ✓"}
            </div>
            {canEdit && short > 0 && (
                <div style={{ display: "flex", gap: 4, marginTop: 4, alignItems: "center" }}>
                    <input type="number" min="1" value={qty} onChange={(e) => setQty(e.target.value)}
                        style={{ width: 56, padding: "2px 6px", margin: 0 }} />
                    <button className="btn btn-success btn-sm" onClick={add} disabled={busy}>
                        + {t("order_detail.add_stock")}
                    </button>
                </div>
            )}
        </div>
    );
}

function fmt(d) { return d ? new Date(d).toLocaleDateString("en-IN") : "—"; }

// Full order lifecycle for the timeline. The step matching the CURRENT status is
// `active` (amber); steps the order has moved PAST are `done` (green ✓); later
// steps are pending (grey). "delivered" is treated as done on handover, and the
// final "fully_paid" step is the active one while a balance remains — so a
// delivered-with-due order shows Delivered ✓ and Fully Paid as the active step.
function buildTimeline(order) {
    const balance = parseFloat(order.total_amount) - parseFloat(order.advance_paid) - parseFloat(order.final_paid);
    const s = order.order_status;
    const keys = ["placed", "confirmed", ...(order.is_made_to_order ? ["in_production"] : []), "ready_for_pickup", "delivered", "fully_paid"];
    let activeKey;
    if (s === "awaiting_payment" || s === "pending") activeKey = "placed";
    else if (s === "confirmed") activeKey = "confirmed";
    else if (s === "in_production") activeKey = "in_production";
    else if (s === "ready_for_pickup") activeKey = "ready_for_pickup";
    else if (s === "delivered") activeKey = balance > 0.01 ? "fully_paid" : null; // null = fully complete
    else activeKey = "placed";
    const activeIndex = activeKey ? keys.indexOf(activeKey) : keys.length;
    const steps = keys.map((key, i) => ({ key, done: i < activeIndex, active: i === activeIndex }));
    return { steps };
}

const PAY_BADGE = {
    advance_paid: "badge-advance",
    fully_paid: "badge-fully-paid",
    pending_after_delivery: "badge-pending-due",
    refunded: "badge-refunded",
};
