import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import api from "../api";

export default function NotificationBell() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    const [items, setItems] = useState([]);
    const [unread, setUnread] = useState(0);
    const ref = useRef();

    const load = async () => {
        try {
            const { data } = await api.get("/admin/api/notifications");
            setItems(data.notifications || []);
            setUnread(data.unread || 0);
        } catch {}
    };

    useEffect(() => {
        load();
        const id = setInterval(load, 30000); // poll every 30s
        return () => clearInterval(id);
    }, []);

    useEffect(() => {
        const onClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener("mousedown", onClick);
        return () => document.removeEventListener("mousedown", onClick);
    }, []);

    const openItem = async (n) => {
        if (!n.is_read) { try { await api.put(`/admin/api/notifications/${n.id}/read`); } catch {} }
        setOpen(false);
        if (n.order_id) navigate(`/orders/${n.order_id}`);
        load();
    };

    const markAll = async () => { try { await api.put("/admin/api/notifications/read-all"); load(); } catch {} };

    return (
        <div className="notif-bell" ref={ref}>
            <button className="notif-bell-btn" onClick={() => setOpen((o) => !o)} title={t("notif.title")}>
                🔔{unread > 0 && <span className="notif-count">{unread > 9 ? "9+" : unread}</span>}
            </button>
            {open && (
                <div className="notif-dropdown">
                    <div className="notif-dd-head">
                        <strong>{t("notif.title")}</strong>
                        {unread > 0 && <button className="notif-markall" onClick={markAll}>{t("notif.mark_all")}</button>}
                    </div>
                    <div className="notif-list">
                        {items.length === 0 && <div className="notif-empty">{t("notif.none")}</div>}
                        {items.map((n) => (
                            <div key={n.id} className={`notif-item ${n.is_read ? "" : "unread"}`} onClick={() => openItem(n)}>
                                <div className="notif-title">{n.title}</div>
                                {n.message && <div className="notif-msg">{n.message}</div>}
                                <div className="notif-time">{new Date(n.created_at).toLocaleString("en-IN")}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
