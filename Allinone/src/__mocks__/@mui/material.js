module.exports = {
    Button: (props) => {
        const React = require('react');
        return <button onClick={props.onClick}>{props.children}</button>;
    }
};