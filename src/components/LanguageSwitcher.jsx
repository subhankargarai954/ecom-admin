import React from "react";
import { useTranslation } from "react-i18next";

export default function LanguageSwitcher() {
    const { i18n } = useTranslation();

    return (
        <select
            className="admin-lang-switcher"
            value={i18n.resolvedLanguage}
            onChange={(e) => i18n.changeLanguage(e.target.value)}
            aria-label="Select language"
            title="Language / ভাষা"
        >
            <option value="en">ENG</option>
            <option value="bn">বাংলা</option>
        </select>
    );
}
