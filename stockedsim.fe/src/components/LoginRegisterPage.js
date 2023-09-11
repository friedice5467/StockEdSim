import React, { useState } from 'react';
import jwtDecode from 'jwt-decode';
import PasswordStrengthBar from 'react-password-strength-bar';
import { useAuth } from '../helpers/AuthContext';
import LoadingModal from './LoadingModal';
import { useNavigate } from 'react-router-dom';
import './LoginRegisterPage.css';

function LoginRegisterPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoginView, setIsLoginView] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const { setCurrentUser } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async () => {
        if (!email || !password) {
            alert('Please fill in both email and password fields.');
            return;
        }

        if (!isLoginView && password !== confirmPassword) {
            alert('Passwords do not match.');
            return;
        }

        setIsLoading(true);

        const endpoint = isLoginView
            ? `${process.env.REACT_APP_API_BASE_URL}/api/identity/login`
            : `${process.env.REACT_APP_API_BASE_URL}/api/identity/register`;

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        setIsLoading(false);

        if (response.ok) {
            if (isLoginView) {
                const data = await response.json();
                localStorage.setItem('token', data.token);
                const decodedToken = jwtDecode(data.token);
                setCurrentUser({ userId: decodedToken.nameid, email: decodedToken.sub });

                navigate('/');
            } else {
                setIsLoginView(true);
                alert('Registration successful! Please login.');
            }
        } else {
            const errorData = await response.json();
            alert(errorData.message || 'An error occurred.');
        }
    }

    return (
        <div className="auth-container">
            {isLoading && <LoadingModal />}

            <h2>{isLoginView ? 'Login' : 'Register'}</h2>
            <div className="input-container">
                <label>Email:</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="input-container">
                <label>Password:</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                {!isLoginView && <PasswordStrengthBar password={password} />}
            </div>
            {!isLoginView && (
                <div className="input-container">
                    <label>Confirm Password:</label>
                    <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                </div>
            )}
            <button onClick={handleSubmit}>{isLoginView ? 'Login' : 'Register'}</button>
            <p className="toggle-view" onClick={() => setIsLoginView(!isLoginView)}>
                {isLoginView ? 'Need an account? Register' : 'Have an account? Login'}
            </p>
        </div>
    );
}

export default LoginRegisterPage;