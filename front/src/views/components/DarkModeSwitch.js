// src/views/components/DarkModeSwitch.jsx
import React, { useContext } from "react";
import "../../styles/DarkModeSwitch.css";
import { AuthContext } from "../../AuthContext";

function DarkModeSwitch() {
    const { darkMode, setDarkMode } = useContext(AuthContext);

    return (
        <label className="switch">
            <input
                type="checkbox"
                checked={darkMode}
                onChange={() => setDarkMode(!darkMode)}
            />
            <span className="slider round"></span>
        </label>
    );
}

export default DarkModeSwitch;
