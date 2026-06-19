import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api";

const STEPS = ["pending", "confirmed", "ready_for_pickup", "delivered"];

export default function OrderDetail() {
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

    useEffect(() => { fetchOrder(); }, [id]);

    const doAction = async (fn) => {
        setActionLoading(true); setError(""); setSuccess("");
        try { await fn(); await fetchOrder(); }
        catch (err) { setError(err.response?.data?.error || "Action failed."); }
        finally { setActionLoading(false); }
    };

    const handleConfirm = () => doAction(async () => {
        await api.put(`/admin/api/orders/${id}/confirm`, confirmForm);
        setSuccess("Order confirmed."); setShowConfirmModal(false);
    });

    const handleSetDeliveryDate = () => doAction(async () => {
        await api.put(`/admin/api/orders/${id}/delivery-date`, { final_delivery_date: deliveryDate });
        setSuccess("Final delivery date set."); setShowDeliveryDateModal(false);
    });

    const handleDeliver = () => doAction(async () => {
        const { data } = await api.put(`/admin/api/orders/${id}/deliver`, deliverForm);
        setSuccess(`Delivery recorded. ${data.pending_amount > 0 ? `Pending due: ₹${data.pending_amount}` : "Fully paid."}`);
        setShowDeliverModal(false);
    });

    const handleCancel = () => doAction(async () => {
        await api.put(`/admin/api/orders/${id}/cancel`, { cancellation_reason: cancelReason });
        setSuccess("Order cancelled."); setShowCancelModal(false);
    });

    const handleMarkRefund = () => doAction(async () => {
        await api.put(`/admin/api/orders/${id}/refund`);
        setSuccess("Refund marked as issued.");
    });

    if (loading) return <div style={{ padding: 40, color: "#636e72" }}>Loading…</div>;
    if (!order) return <div className="alert alert-error">Order not found.</div>;

    const stepIdx = STEPS.indexOf(order.order_status);
    const pending_amount = Math.max(0,
        parseFloat(order.total_amount) - parseFloat(order.advance_paid) - parseFloat(order.final_paid)
    ).toFixed(2);

    return (
        <div>
            <div className="topbar">
                <h1>Order #{order.id}</h1>
                <button className="btn btn-outline" onClick={() => navigate("/orders")}>← Back to Orders</button>
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
                                <div className="timeline-label">{s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {order.order_status === "cancelled" && (
                <div className="alert alert-error">
                    <strong>Cancelled</strong>{order.cancellation_reason ? ` — ${order.cancellation_reason}` : ""}
                </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                {/* Customer Info */}
                <div className="card">
                    <div className="card-header"><h2>Customer</h2></div>
                    <p><strong>{order.user?.name}</strong></p>
                    <p style={{ color: "#636e72", fontSize: 13 }}>📞 {order.user?.phone}</p>
                    {order.user?.email && <p style={{ color: "#636e72", fontSize: 13 }}>✉️ {order.user.email}</p>}
                    {order.user?.address && <p style={{ color: "#636e72", fontSize: 13 }}>📍 {order.user.address}</p>}
                </div>

                {/* Payment Info */}
                <div className="card">
                    <div className="card-header"><h2>Payment</h2></div>
                    <table style={{ width: "100%", fontSize: 13 }}>
                        <tbody>
                            <tr><td style={{ padding: "4px 0", color: "#636e72" }}>Order Total</td><td style={{ textAlign: "right", fontWeight: 600 }}>₹{parseFloat(order.total_amount).toFixed(2)}</td></tr>
                            <tr><td style={{ padding: "4px 0", color: "#636e72" }}>Advance Paid ({order.advance_payment_mode})</td><td style={{ textAlign: "right", color: "#00b894", fontWeight: 600 }}>₹{parseFloat(order.advance_paid).toFixed(2)}</td></tr>
                            {parseFloat(order.final_paid) > 0 && (
                                <tr><td style={{ padding: "4px 0", color: "#636e72" }}>Final Paid ({order.final_payment_mode})</td><td style={{ textAlign: "right", color: "#00b894", fontWeight: 600 }}>₹{parseFloat(order.final_paid).toFixed(2)}</td></tr>
                            )}
                            <tr style={{ borderTop: "1px solid #dfe6e9" }}>
                                <td style={{ padding: "8px 0 4px", fontWeight: 700 }}>Pending Due</td>
                                <td style={{ textAlign: "right", fontWeight: 700, color: parseFloat(pending_amount) > 0 ? "#d63031" : "#00b894" }}>
                                    ₹{pending_amount}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                    <div style={{ marginTop: 8 }}>
                        <PayBadge status={order.payment_status} />
                    </div>
                </div>

                {/* Delivery Info */}
                <div className="card">
                    <div className="card-header"><h2>Delivery</h2></div>
                    <table style={{ width: "100%", fontSize: 13 }}>
                        <tbody>
                            <tr><td style={{ padding: "4px 0", color: "#636e72" }}>All Items Available?</td>
                                <td style={{ textAlign: "right" }}><span className={`badge ${order.all_items_available ? "badge-ready" : "badge-warning"}`}>{order.all_items_available ? "Yes" : "No (Pre-order)"}</span></td></tr>
                            {order.tentative_delivery_date && (
                                <tr><td style={{ padding: "4px 0", color: "#636e72" }}>Tentative Date</td>
                                    <td style={{ textAlign: "right", color: "#e17055" }}>~{fmt(order.tentative_delivery_date)}</td></tr>
                            )}
                            {order.final_delivery_date && (
                                <tr><td style={{ padding: "4px 0", color: "#636e72" }}>Final Delivery Date</td>
                                    <td style={{ textAlign: "right", color: "#00b894", fontWeight: 700 }}>{fmt(order.final_delivery_date)}</td></tr>
                            )}
                            {order.actual_delivery_date && (
                                <tr><td style={{ padding: "4px 0", color: "#636e72" }}>Actually Collected On</td>
                                    <td style={{ textAlign: "right", fontWeight: 600 }}>{new Date(order.actual_delivery_date).toLocaleString("en-IN")}</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Actions */}
                <div className="card">
                    <div className="card-header"><h2>Actions</h2></div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {order.order_status === "pending" && !order.all_items_available && (
                            <button className="btn btn-primary" onClick={() => setShowConfirmModal(true)}>
                                ✅ Confirm Pre-order & Set Tentative Date
                            </button>
                        )}
                        {["pending", "confirmed"].includes(order.order_status) && (
                            <button className="btn btn-success" onClick={() => setShowDeliveryDateModal(true)}>
                                📅 Set Final Delivery Date
                            </button>
                        )}
                        {order.order_status === "ready_for_pickup" && (
                            <button className="btn btn-primary" onClick={() => setShowDeliverModal(true)}>
                                🎉 Mark as Delivered (Customer Collected)
                            </button>
                        )}
                        {order.order_status === "cancelled" && order.payment_status !== "refunded" && (
                            <button className="btn btn-secondary" onClick={handleMarkRefund}>
                                💵 Mark Refund as Issued
                            </button>
                        )}
                        {!["delivered", "cancelled"].includes(order.order_status) && (
                            <button className="btn btn-danger" onClick={() => setShowCancelModal(true)}>
                                ✕ Cancel Order
                            </button>
                        )}
                        {!order.order_status && (
                            <p style={{ color: "#636e72", fontSize: 13 }}>No actions available.</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Order Items */}
            <div className="card" style={{ marginTop: 8 }}>
                <div className="card-header"><h2>Order Items</h2></div>
                <div className="table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                <th>Product</th>
                                <th>Variant</th>
                                <th>Unit Price</th>
                                <th>Discount</th>
                                <th>Qty</th>
                                <th>Subtotal</th>
                                <th>In Stock?</th>
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
                                                {item.was_available_at_order ? "In Stock" : "Pre-order"}
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
                <Modal title="Confirm Pre-order" onClose={() => setShowConfirmModal(false)}>
                    <div className="form-group" style={{ marginBottom: 12 }}>
                        <label>Tentative Delivery Date</label>
                        <input type="date" value={confirmForm.tentative_delivery_date}
                            onChange={(e) => setConfirmForm({ ...confirmForm, tentative_delivery_date: e.target.value })} />
                    </div>
                    <div className="form-group" style={{ marginBottom: 16 }}>
                        <label>Admin Notes (visible to staff)</label>
                        <textarea value={confirmForm.admin_notes}
                            onChange={(e) => setConfirmForm({ ...confirmForm, admin_notes: e.target.value })}
                            placeholder="e.g. Stock arriving Thursday…" rows={2} />
                    </div>
                    <div className="modal-actions">
                        <button className="btn btn-outline" onClick={() => setShowConfirmModal(false)}>Cancel</button>
                        <button className="btn btn-primary" onClick={handleConfirm} disabled={actionLoading}>Confirm Order</button>
                    </div>
                </Modal>
            )}

            {showDeliveryDateModal && (
                <Modal title="Set Final Delivery Date" onClose={() => setShowDeliveryDateModal(false)}>
                    <div className="form-group" style={{ marginBottom: 16 }}>
                        <label>Final Delivery Date *</label>
                        <input type="date" value={deliveryDate}
                            onChange={(e) => setDeliveryDate(e.target.value)} required />
                    </div>
                    <p style={{ fontSize: 12, color: "#636e72" }}>
                        Setting this marks the order as <strong>Ready for Pickup</strong>. The customer can come to collect on or after this date.
                    </p>
                    <div className="modal-actions">
                        <button className="btn btn-outline" onClick={() => setShowDeliveryDateModal(false)}>Cancel</button>
                        <button className="btn btn-success" onClick={handleSetDeliveryDate} disabled={actionLoading || !deliveryDate}>Confirm Date</button>
                    </div>
                </Modal>
            )}

            {showDeliverModal && (
                <Modal title="Record Delivery & Final Payment" onClose={() => setShowDeliverModal(false)}>
                    <div className="alert alert-info">
                        <strong>Total: ₹{parseFloat(order.total_amount).toFixed(2)}</strong> |
                        Advance Paid: ₹{parseFloat(order.advance_paid).toFixed(2)} |
                        Balance Due: ₹{pending_amount}
                    </div>
                    <div className="form-group" style={{ marginBottom: 12 }}>
                        <label>Final Payment Received (₹)</label>
                        <input type="number" step="0.01" min="0"
                            value={deliverForm.final_paid}
                            onChange={(e) => setDeliverForm({ ...deliverForm, final_paid: e.target.value })}
                            placeholder={`Max ${pending_amount}`} />
                    </div>
                    <div className="form-group" style={{ marginBottom: 16 }}>
                        <label>Payment Mode</label>
                        <select value={deliverForm.final_payment_mode}
                            onChange={(e) => setDeliverForm({ ...deliverForm, final_payment_mode: e.target.value })}>
                            <option value="cash">Cash</option>
                            <option value="online">Online</option>
                            <option value="mixed">Mixed (Cash + Online)</option>
                        </select>
                    </div>
                    <p style={{ fontSize: 12, color: "#636e72" }}>
                        If the amount collected is less than the balance due, the difference will be recorded as a pending due.
                    </p>
                    <div className="modal-actions">
                        <button className="btn btn-outline" onClick={() => setShowDeliverModal(false)}>Cancel</button>
                        <button className="btn btn-primary" onClick={handleDeliver} disabled={actionLoading}>Mark as Delivered</button>
                    </div>
                </Modal>
            )}

            {showCancelModal && (
                <Modal title="Cancel Order" onClose={() => setShowCancelModal(false)}>
                    <div className="alert alert-error">This will cancel the order and restore stock for available items.</div>
                    <div className="form-group" style={{ marginBottom: 16 }}>
                        <label>Cancellation Reason</label>
                        <textarea value={cancelReason} onChange={(e) => setCancelReason(e.target.value)}
                            placeholder="e.g. Item permanently out of stock" rows={2} />
                    </div>
                    <div className="modal-actions">
                        <button className="btn btn-outline" onClick={() => setShowCancelModal(false)}>Back</button>
                        <button className="btn btn-danger" onClick={handleCancel} disabled={actionLoading}>Cancel Order</button>
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

function PayBadge({ status }) {
    const map = {
        advance_paid: ["badge-advance", "Advance Paid"],
        fully_paid: ["badge-fully-paid", "Fully Paid"],
        pending_after_delivery: ["badge-pending-due", "Due After Delivery"],
        refunded: ["badge-refunded", "Refunded"],
    };
    const [cls, label] = map[status] || ["", status];
    return <span className={`badge ${cls}`}>{label}</span>;
}
