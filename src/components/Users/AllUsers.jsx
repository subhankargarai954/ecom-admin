import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import api from "../../api";

export default function AllUsers() {
    const { t } = useTranslation();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    useEffect(() => {
        api.get("/admin/api/users")
            .then((r) => setUsers(r.data.users || []))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const filtered = users.filter((u) =>
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.phone.includes(search)
    );

    if (loading) return <div style={{ padding: 40, color: "#636e72" }}>{t("customers.loading")}</div>;

    return (
        <div>
            <div className="topbar"><h1>{t("customers.title")}</h1></div>
            <div className="card">
                <div className="card-header">
                    <h2>{t("customers.count", { count: users.length })}</h2>
                    <input type="text" placeholder={t("customers.search")}
                        value={search} onChange={(e) => setSearch(e.target.value)}
                        style={{ padding: "7px 12px", border: "1px solid #dfe6e9", borderRadius: 6, fontSize: 13, width: 240 }} />
                </div>
                <div className="table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>{t("customers.col_name")}</th>
                                <th>{t("customers.col_phone")}</th>
                                <th>{t("customers.col_email")}</th>
                                <th>{t("customers.col_address")}</th>
                                <th>{t("customers.col_joined")}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 && (
                                <tr><td colSpan={6}>
                                    <div className="empty-state">
                                        <div className="empty-icon">👥</div>
                                        <h3>{t("customers.none")}</h3>
                                    </div>
                                </td></tr>
                            )}
                            {filtered.map((u) => (
                                <tr key={u.id}>
                                    <td>{u.id}</td>
                                    <td><strong>{u.name}</strong></td>
                                    <td>{u.phone}</td>
                                    <td>{u.email || "—"}</td>
                                    <td>{u.address || "—"}</td>
                                    <td>{new Date(u.created_at).toLocaleDateString("en-IN")}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
