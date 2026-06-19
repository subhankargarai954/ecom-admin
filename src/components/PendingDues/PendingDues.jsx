import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import api from "../../api";

export default function PendingDues() {
    const { t } = useTranslation();
    const [dues, setDues] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [collectModal, setCollectModal] = useState(null); // { order_id, pending_amount }
    const [collectForm, setCollectForm] = useState({ amount_collected: "", payment_mode: "cash" });
    const [saving, setSaving] = useState(false);

    const fetchDues = async () => {
        try {
            const { data } = await api.get("/admin/api/orders/pending-dues");
            setDues(data.dues || []);
        } catch { setError(t("pending_dues.load_failed")); }
        finally { setLoading(false); }
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => { fetchDues(); }, []);

    const totalDue = dues.reduce((s, d) => s + parseFloat(d.pending_amount), 0);

    const handleCollect = async () => {
        setSaving(true);
        try {
            const { data } = await api.put(`/admin/api/orders/${collectModal.order_id}/collect-due`, collectForm);
            alert(data.message);
            setCollectModal(null);
            setCollectForm({ amount_collected: "", payment_mode: "cash" });
            fetchDues();
        } catch (err) {
            alert(err.response?.data?.error || "Failed to record collection.");
        } finally { setSaving(false); }
    };

    if (loading) return <div style={{ padding: 40, color: "#636e72" }}>{t("pending_dues.loading")}</div>;

    return (
        <div>
            <div className="topbar"><h1>{t("pending_dues.title")}</h1></div>
            {error && <div className="alert alert-error">{error}</div>}

            {dues.length > 0 && (
                <div className="card" style={{ marginBottom: 20, background: "#fff5f5", border: "1px solid #ffcccc" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                            <div style={{ fontSize: 13, color: "#636e72" }}>{t("pending_dues.total_outstanding")}</div>
                            <div style={{ fontSize: 28, fontWeight: 700, color: "#d63031" }}>₹{totalDue.toFixed(2)}</div>
                        </div>
                        <div style={{ fontSize: 32 }}>💰</div>
                    </div>
                </div>
            )}

            <div className="card">
                <div className="card-header">
                    <h2>{t("pending_dues.count", { count: dues.length })}</h2>
                </div>
                {dues.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">✅</div>
                        <h3>{t("pending_dues.none_title")}</h3>
                        <p>{t("pending_dues.none_hint")}</p>
                    </div>
                ) : (
                    <div className="table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th>{t("pending_dues.col_order")}</th>
                                    <th>{t("pending_dues.col_customer")}</th>
                                    <th>{t("pending_dues.col_contact")}</th>
                                    <th>{t("pending_dues.col_total")}</th>
                                    <th>{t("pending_dues.col_advance")}</th>
                                    <th>{t("pending_dues.col_final")}</th>
                                    <th>{t("pending_dues.col_pending")}</th>
                                    <th>{t("pending_dues.col_delivered")}</th>
                                    <th>{t("pending_dues.col_items")}</th>
                                    <th>{t("pending_dues.col_actions")}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {dues.map((d) => (
                                    <tr key={d.order_id}>
                                        <td><strong>#{d.order_id}</strong></td>
                                        <td><strong>{d.customer?.name}</strong></td>
                                        <td>
                                            <div>{d.customer?.phone}</div>
                                            {d.customer?.email && <small style={{ color: "#636e72" }}>{d.customer.email}</small>}
                                        </td>
                                        <td>₹{parseFloat(d.total_amount).toFixed(2)}</td>
                                        <td>₹{parseFloat(d.advance_paid).toFixed(2)}</td>
                                        <td>₹{parseFloat(d.final_paid).toFixed(2)}</td>
                                        <td>
                                            <strong style={{ color: "#d63031", fontSize: 15 }}>
                                                ₹{parseFloat(d.pending_amount).toFixed(2)}
                                            </strong>
                                        </td>
                                        <td>{d.delivered_on ? new Date(d.delivered_on).toLocaleDateString("en-IN") : "—"}</td>
                                        <td>
                                            {d.items?.map((item) => (
                                                <div key={item.id} style={{ fontSize: 12, color: "#636e72" }}>
                                                    {item.product?.name}{item.variant ? ` (${item.variant.variant_name})` : ""} × {item.quantity}
                                                </div>
                                            ))}
                                        </td>
                                        <td style={{ display: "flex", gap: 6 }}>
                                            <button className="btn btn-success btn-sm"
                                                onClick={() => { setCollectModal({ order_id: d.order_id, pending_amount: d.pending_amount }); setCollectForm({ amount_collected: d.pending_amount, payment_mode: "cash" }); }}>
                                                {t("pending_dues.collect")}
                                            </button>
                                            <Link to={`/orders/${d.order_id}`} className="btn btn-outline btn-sm">{t("pending_dues.view")}</Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {collectModal && (
                <div className="modal-overlay" onClick={() => setCollectModal(null)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <h3>{t("pending_dues.modal_title", { id: collectModal.order_id })}</h3>
                        <div className="alert alert-info">{t("pending_dues.modal_outstanding")} <strong>₹{parseFloat(collectModal.pending_amount).toFixed(2)}</strong></div>
                        <div className="form-group" style={{ marginBottom: 12 }}>
                            <label>{t("pending_dues.modal_amount")}</label>
                            <input type="number" step="0.01" min="0"
                                value={collectForm.amount_collected}
                                onChange={(e) => setCollectForm({ ...collectForm, amount_collected: e.target.value })} />
                        </div>
                        <div className="form-group" style={{ marginBottom: 16 }}>
                            <label>{t("pending_dues.modal_payment_mode")}</label>
                            <select value={collectForm.payment_mode}
                                onChange={(e) => setCollectForm({ ...collectForm, payment_mode: e.target.value })}>
                                <option value="cash">{t("pending_dues.cash")}</option>
                                <option value="online">{t("pending_dues.online")}</option>
                            </select>
                        </div>
                        <div className="modal-actions">
                            <button className="btn btn-outline" onClick={() => setCollectModal(null)}>{t("pending_dues.modal_cancel")}</button>
                            <button className="btn btn-success" onClick={handleCollect} disabled={saving}>{t("pending_dues.modal_record")}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
