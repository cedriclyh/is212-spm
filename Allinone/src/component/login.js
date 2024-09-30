// src/components/Login.js
import React, { useState } from 'react';

const Login = () => {
    const [staffId, setStaffId] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        
        // Example login logic (replace with your API call)
        if (staffId === '' && password === 'password') {
            // Successful login logic
            console.log('Login successful');
        } else {
            // Handle login error
            setError('Invalid email or password');
        }
    };

    return (
        <div>
            <h2>Login</h2>
            <form onSubmit={handleSubmit}>
                <div>
                    <label>Staff ID:</label>
                    <input 
                        type="number" 
                        value={staffId} 
                        onChange={(e) => setStaffId(e.target.value)} 
                        required 
                    />
                </div>
                <div>
                    <label>Password:</label>
                    <input 
                        type="password" 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)} 
                        required 
                    />
                </div>
                {error && <p style={{ color: 'blue' }}>{error}</p>}
                <button type="submit">Login</button>
            </form>
        </div>
    );
};

export default Login;
