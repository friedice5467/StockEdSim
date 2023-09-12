import React, { useState } from 'react';
import jwtDecode from 'jwt-decode';
import PasswordStrengthBar from 'react-password-strength-bar';
import { useAuth } from '../helpers/AuthContext';
import LoadingModal from './LoadingModal';
import { useNavigate } from 'react-router-dom';

function LoginRegisterPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoginView, setIsLoginView] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const { setCurrentUser } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async () => {
        if (!username || !password) {
            alert('Please fill in both email and password fields.');
            return;
        }

        if (!isLoginView && password !== confirmPassword) {
            alert('Passwords do not match.');
            return;
        }

        setIsLoading(true);

        const endpoint = isLoginView
            ? `${process.env.REACT_APP_API_BASE_URL}/identity/login`
            : `${process.env.REACT_APP_API_BASE_URL}/identity/register`;

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password, isStudentId: false })
        });

        setIsLoading(false);

        if (response.ok) {
            if (isLoginView) {
                const data = await response.json();
                localStorage.setItem('token', data.token);
                const decodedToken = jwtDecode(data.token);
                setCurrentUser({
                    userId: decodedToken.sub,
                    email: decodedToken.email,
                    roles: decodedToken.roles
                });

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

    const SetterClick = () => {
        setIsLoginView(!isLoginView);
        setPassword("");
    }


    return (
        <div className="flex justify-center items-center h-screen bg-gray-100">
            {isLoading && <LoadingModal />}

            <div className="w-full max-w-md bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-2xl font-bold mb-5 text-gray-900 text-center">{isLoginView ? 'Login' : 'Register'}</h2>

                <div className="mb-4">
                    <label className="block text-gray-700">Email:</label>
                    <input type="email" value={username} onChange={(e) => setUsername(e.target.value)} required className="mt-1 p-2 w-full border rounded-md" />
                </div>
                <div className="mb-4">
                    <label className="block text-gray-700">Password:</label>
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="mt-1 p-2 w-full border rounded-md" />
                    {!isLoginView && <PasswordStrengthBar password={password} className="mt-2" />}
                </div>
                {!isLoginView && (
                    <div className="mb-4">
                        <label className="block text-gray-700">Confirm Password:</label>
                        <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className="mt-1 p-2 w-full border rounded-md" />
                    </div>
                )}
                <button onClick={handleSubmit} className="w-full p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:border-blue-900 focus:ring ring-blue-200 active:bg-blue-800">
                    {isLoginView ? 'Login' : 'Register'}
                </button>
                <p className="mt-4 text-center text-gray-500 hover:text-gray-600 cursor-pointer" onClick={() => SetterClick()}>
                    {isLoginView ? 'Need an account? Register' : 'Have an account? Login'}
                </p>
            </div>
        </div>
    );
}

export default LoginRegisterPage;