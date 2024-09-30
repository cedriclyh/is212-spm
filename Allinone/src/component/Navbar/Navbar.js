import { Link, useMatch, useResolvedPath } from "react-router-dom"
import "./Navbar.css";

export default function Navbar() {
    return <nav className="nav">
        <Link to="/" className="site-title">Allinone</Link>
        <ul>
            <li>
                <CustomLink to="/search">Search</CustomLink>
            </li>
            <li>
                <CustomLink to="/home">Home</CustomLink>
            </li>
            <li>
                <CustomLink to="/notification">Notification</CustomLink>
            </li>
            <li>
                <CustomLink to="/profile">Profile Picture</CustomLink>
            </li>
        </ul>
    </nav>
}

function CustomLink({ to, children, ...props}) {
    const resolvedPath = useResolvedPath(to)
    const isActive = useMatch({ path: resolvedPath.pathname, end: true })
    return (
        <li className={isActive ? "active" : ""}>
            <Link to={to} {...props}>
                {children}
            </Link>
        </li>
    )
}