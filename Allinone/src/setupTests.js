import '@testing-library/jest-dom';
import React from 'react';

jest.mock('@mui/material', () => ({
    Button: function Button({ children, onClick, ...props }) {
        return (
            <button
                onClick={onClick}
                type="button"
                {...props}
            >
                {children}
            </button>
        );
    }
}));

jest.mock('@nextui-org/react', () => ({
    Dropdown: function Dropdown({ children }) {
        return <div>{children}</div>;
    },
    DropdownTrigger: function DropdownTrigger({ children }) {
        return <div>{children}</div>;
    },
    DropdownMenu: function DropdownMenu({ children, onSelectionChange }) {
        return (
            <select onChange={(e) => onSelectionChange?.(new Set([e.target.value]))}>
                {children}
            </select>
        );
    },
    DropdownItem: function DropdownItem({ children, key }) {
        return <option value={key}>{children}</option>;
    }
}));

// Mock axios
jest.mock('axios');

// Mock window functions
window.confirm = jest.fn(() => true);
window.alert = jest.fn();