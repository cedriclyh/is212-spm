module.exports = {
    Dropdown: (props) => {
        const React = require('react');
        return <div data-testid="dropdown">{props.children}</div>;
    },
    DropdownTrigger: (props) => {
        const React = require('react');
        return <div data-testid="dropdown-trigger">{props.children}</div>;
    },
    DropdownMenu: (props) => {
        const React = require('react');
        return (
            <select
                data-testid="dropdown-menu"
                onChange={(e) => props.onSelectionChange(new Set([e.target.value]))}
            >
                {props.children}
            </select>
        );
    },
    DropdownItem: (props) => {
        const React = require('react');
        return <option value={props.key}>{props.children}</option>;
    }
};