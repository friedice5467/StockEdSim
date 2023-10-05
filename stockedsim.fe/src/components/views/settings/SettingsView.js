import React, { useState } from 'react';
import api from '../../../helpers/api';
import ImageUpload from '../../uiHelpers/ImageUpload';
import LoadingModal from '../../uiHelpers/LoadingModal';
import ApiExceptionModal from '../../uiHelpers/ApiExceptionModal';

function SettingsView({ currentUser, updateCurrentUser }) {
    const [isLoading, setIsLoading] = useState(false);
    const [apiError, setApiError] = useState(null);
    const [userProfileImg, setUserProfileImg] = useState(currentUser.profileImgUrl)
    const [userFullname, setUserFullName] = useState(currentUser.fullName)

    const saveImageUrlToDatabase = async (formData) => {
        setIsLoading(true);
        try {
            const data = await api.post(`/identity/myprofile/updateImg/`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            if (data.IsSuccess) {
                setUserProfileImg(data.Data);
            }
        } catch (error) {
            if (error.response && error.response.data) {
                setApiError(error.response.data);
            } else {
                setApiError("Error uploading image.");
            }
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="h-full w-full overflow-y-auto p-6 bg-gray-100">
            <div className="max-w-screen-lg mx-auto">

                {/* Profile Image Section */}
                <div className="bg-white rounded-md shadow p-6 mb-6" style={{ textAlign: '-webkit-center'}}>
                    <h2 className="text-2xl font-semibold mb-4">Profile Image</h2>
                    <div className="flex items-center">
                        <ImageUpload uploadToBackend={saveImageUrlToDatabase} imgUrl={userProfileImg} updateCurrentUser={updateCurrentUser} />
                    </div>
                </div>

                {/* Name Update Section */}
                <div className="bg-white rounded-md shadow p-6 mb-6">
                    <h2 className="text-2xl font-semibold mb-4">Full Name</h2>
                    <div className="flex items-center">
                        <input
                            type="text"
                            className="border rounded-md p-2 w-full mr-4"
                            value={userFullname}
                            onChange={e => setUserFullName(e.target.value)}
                        />
                        <button
                            className="bg-blue-500 text-white px-4 py-2 rounded-md transition hover:bg-blue-600"
                        >
                            Update Name
                        </button>
                    </div>
                </div>

            </div>

            {isLoading && <LoadingModal />}
            {apiError && <ApiExceptionModal error={apiError} onClose={() => setApiError(null)} />}
        </div>
    );

}

export default SettingsView;