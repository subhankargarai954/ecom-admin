import React from "react";
import { NavLink } from "react-router-dom";

import "./OptionBar.css";

function OptionBar({ base, options }) {
    return (
        <div className="optionbar">
            {options.map((option, index) => {
                if (option === "All")
                    return (
                        <NavLink
                            className={"optionbar-navlink"}
                            to={`/${base}`}
                            key={index}
                        >{` ${option} `}</NavLink>
                    );
                else
                    return (
                        <NavLink
                            className={"optionbar-navlink"}
                            to={`/${base}/${option}`}
                            key={index}
                        >{` ${option} `}</NavLink>
                    );
            })}
        </div>
    );
}

export default OptionBar;
