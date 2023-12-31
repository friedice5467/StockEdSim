import React, { useState, useEffect } from 'react';
import api from '../../../helpers/api';
import { useAuth } from '../../../helpers/AuthContext';
import LoadingModal from '../../uiHelpers/LoadingModal';
import ApiExceptionModal from '../../uiHelpers/ApiExceptionModal';
import AddClassModal from './AddClassModal';

function ClassesView() {
    const { currentUser } = useAuth();
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [apiError, setApiError] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);

    useEffect(() => {
        if (currentUser && (currentUser.role === "Teacher" || currentUser.role === "Admin")) {
            api.get("/market/myclasses/students")
                .then(response => {
                    setClasses(response.data);
                    setLoading(false);
                })
                .catch(error => {
                    console.error("Error fetching classes:", error);
                    setApiError(error.message || 'An error occurred.');
                    setLoading(false);
                });
        }
    }, [currentUser]);

    const handleCreateClass = (className, defaultValue) => {
        setLoading(true);
        api.post("/market/myclasses/createClass",
            {
                ClassName: className,
                TeacherId: currentUser.userId,
                DefaultBalance: defaultValue
            })
            .then(response => {
                setClasses(prev => Array.isArray(prev) ? [...prev, response.data] : [response.data]);
                setShowAddModal(false);
                setLoading(false);
            })
            .catch(error => {
                console.error("Error creating class:", error);
                setApiError(error.message || 'An error occurred.');
                setLoading(false);
            });
    };

    return (
        <div className="p-4">
            {loading && <LoadingModal />}

            <h2 className="text-2xl font-bold mb-4">My Classes</h2>

            {currentUser && (currentUser.role === "Teacher" || currentUser.role === "Admin") && (
                <div className="mb-4">
                    <button onClick={() => setShowAddModal(true)} className="bg-blue-500 text-white p-2 rounded">
                        Add New Class
                    </button>
                </div>
            )}

            <ul>
                {classes && classes.length > 0 && classes.map(cls => (
                    <li key={cls.Id}>
                        <h3 className="text-xl">{cls.ClassName}</h3>
                        <ul>
                            {cls.Students && cls.Students.length > 0 && cls.Students.map(student => (
                                <li key={student.StudentId}>
                                    {student.StudentName} - Profit: {student.Profit} - Transactions: {student.TransactionsCount}
                                </li>
                            ))}
                        </ul>
                    </li>
                ))}
            </ul>


            {showAddModal && <AddClassModal onClose={() => setShowAddModal(false)} onCreate={handleCreateClass} />}
            <ApiExceptionModal error={apiError} onClose={() => setApiError(null)} />
        </div>
    );
}

export default ClassesView;
