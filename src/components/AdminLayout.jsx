import React from "react";
import { NavLink, useNavigate } from "react-router-dom";

const navItems = [
    { to: "/", icon: "📊", label: "Dashboard", end: true },
    { to: "/products", icon: "📦", label: "Products" },
    { to: "/categories", icon: "🏷️", label: "Categories" },
    { to: "/orders", icon: "🛒", label: "Orders" },
    { to: "/pending-dues", icon: "💰", label: "Pending Dues" },
    { to: "/users", icon: "👥", label: "Customers" },
];

export default function AdminLayout({ children }) {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem("adminUser") || "{}");

    const logout = () => {
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminUser");
        navigate("/login");
    };

    return (
        <div className="admin-layout">
            <aside className="sidebar">
                <div className="sidebar-logo">Admin <span>Store</span></div>
                <nav className="sidebar-nav">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            end={item.end}
                            className={({ isActive }) => isActive ? "active" : ""}
                        >
                            <span className="nav-icon">{item.icon}</span>
                            <span>{item.label}</span>
                        </NavLink>
                    ))}
                </nav>
                <div className="sidebar-footer">
                    <div style={{ fontSize: 12, color: "#636e72", marginBottom: 8 }}>
                        👤 {user.name || "Admin"}
                    </div>
                    <button onClick={logout}>Logout</button>
                </div>
            </aside>
            <main className="main-content">{children}</main>
        </div>
    );
}
