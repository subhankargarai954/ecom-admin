// NavigationBar.jsx

import React from "react";
import { NavLink } from "react-router-dom";

// import { useCart } from "../context/CartContext";
// import { useAuth } from "../context/AuthContext";

import "./NavigationBar.css";

function NavigationBar({ list1, list2 }) {
    return (
        <div className="NavigationBar">
            <div className="navbar-logo">
                <NavLink to={"/"} className="navbar-logo-navlink">
                    Logo
                </NavLink>
            </div>
            <div className="navbar-container">
                <div className="navbar-container-child">
                    <div className="navbar-child-element">
                        {list1.map((item, index) => (
                            <NavLink
                                to={`/${item}`}
                                className="navbar-navlink"
                                key={index}
                            >
                                {item}
                            </NavLink>
                        ))}
                    </div>
                </div>
                <div className="navbar-container-child">
                    <div className="navbar-child-element">
                        {list2.map((item, index) => (
                            <NavLink
                                to={`/${item}`}
                                className="navbar-navlink navlink-cart"
                                key={index}
                            >
                                {item}
                            </NavLink>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default NavigationBar;
