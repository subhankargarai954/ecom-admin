import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import api from "../api";
import LanguageSwitcher from "./LanguageSwitcher";

export default function Login() {
    const { t } = useTranslation();
    const [form, setForm] = useState({ phone: "", password: "" });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            const { data } = await api.post("/admin/api/auth/login", form);
            localStorage.setItem("adminToken", data.token);
            localStorage.setItem("adminUser", JSON.stringify(data.admin));
            navigate("/");
        } catch (err) {
            setError(err.response?.data?.error || t("login.failed"));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-box">
                <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>
                    <div style={{ width: 90 }}><LanguageSwitcher /></div>
                </div>
                <h1>🛒 {t("login.title")}</h1>
                <p>{t("login.subtitle")}</p>
                {error && <div className="alert alert-error">{error}</div>}
                <form onSubmit={handleSubmit}>
                    <div className="form-group" style={{ marginBottom: 14 }}>
                        <label>{t("login.phone")}</label>
                        <input type="text" placeholder={t("login.phone_placeholder")} value={form.phone}
                            onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
                    </div>
                    <div className="form-group" style={{ marginBottom: 4 }}>
                        <label>{t("login.password")}</label>
                        <input type="password" placeholder={t("login.password_placeholder")} value={form.password}
                            onChange={(e) => setForm({ ...form, password: e.target.value })} required />
                    </div>
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? t("login.signing_in") : t("login.signin")}
                    </button>
                </form>
            </div>
        </div>
    );
}
