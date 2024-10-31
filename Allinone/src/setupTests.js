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
        return <div data-testid="dropdown">{children}</div>;
    },
    DropdownTrigger: function DropdownTrigger({ children }) {
        return <div data-testid="dropdown-trigger">{children}</div>;
    },
    DropdownMenu: function DropdownMenu({ children, onSelectionChange }) {
        return (
            <select 
                data-testid="dropdown-menu"
                onChange={(e) => onSelectionChange?.(new Set([e.target.value]))}
            >
                {children}
            </select>
        );
    },
    DropdownItem: function DropdownItem(props) {
        return (
            <option 
                value={props.key || props.children}
                data-testid={`dropdown-item-${props.key || props.children}`}
            >
                {props.children}
            </option>
        );
    }
}));

// Mock axios
jest.mock('axios');

// Mock window functions
window.confirm = jest.fn(() => true);
window.alert = jest.fn();