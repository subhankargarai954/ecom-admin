import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

export default function Login() {
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
            setError(err.response?.data?.error || "Login failed.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-box">
                <h1>🛒 Admin Panel</h1>
                <p>Sign in to manage your store</p>
                {error && <div className="alert alert-error">{error}</div>}
                <form onSubmit={handleSubmit}>
                    <div className="form-group" style={{ marginBottom: 14 }}>
                        <label>Phone Number</label>
                        <input type="text" placeholder="10-digit phone" value={form.phone}
                            onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
                    </div>
                    <div className="form-group" style={{ marginBottom: 4 }}>
                        <label>Password</label>
                        <input type="password" placeholder="Password" value={form.password}
                            onChange={(e) => setForm({ ...form, password: e.target.value })} required />
                    </div>
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? "Signing in…" : "Sign In"}
                    </button>
                </form>
            </div>
        </div>
    );
}
