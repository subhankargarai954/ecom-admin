import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "./LanguageSwitcher";
import ThemeToggle from "./ThemeToggle";

const navItems = [
    { to: "/", icon: "📊", key: "dashboard", end: true },
    { to: "/products", icon: "📦", key: "products" },
    { to: "/categories", icon: "🏷️", key: "categories" },
    { to: "/orders", icon: "🛒", key: "orders" },
    { to: "/pending-dues", icon: "💰", key: "pending_dues" },
    { to: "/users", icon: "👥", key: "customers" },
];

export default function AdminLayout({ children }) {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const user = JSON.parse(localStorage.getItem("adminUser") || "{}");

    const logout = () => {
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminUser");
        navigate("/login");
    };

    return (
        <div className="admin-layout">
            <aside className="sidebar">
                <div className="sidebar-logo">{t("nav.brand_admin")} <span>{t("nav.brand_store")}</span></div>
                <nav className="sidebar-nav">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            end={item.end}
                            className={({ isActive }) => isActive ? "active" : ""}
                        >
                            <span className="nav-icon">{item.icon}</span>
                            <span>{t(`nav.${item.key}`)}</span>
                        </NavLink>
                    ))}
                </nav>
                <div className="sidebar-footer">
                    <div style={{ display: "flex", justifyContent: "center", marginBottom: 10 }}>
                        <ThemeToggle />
                    </div>
                    <LanguageSwitcher />
                    <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 8 }}>
                        👤 {user.name || "Admin"}
                    </div>
                    <button onClick={logout}>{t("nav.logout")}</button>
                </div>
            </aside>
            <main className="main-content">{children}</main>
        </div>
    );
}
