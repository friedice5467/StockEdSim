import React, { useState } from 'react';
import api from '../../../helpers/api';
import ImageUpload from '../../uiHelpers/ImageUpload';
import LoadingModal from '../../uiHelpers/LoadingModal';
import ApiExceptionModal from '../../uiHelpers/ApiExceptionModal';

function SettingsView({ currentUser }) {
    const [isLoading, setIsLoading] = useState(false);
    const [apiError, setApiError] = useState(null);
    const [userProfileImg, setUserProfileImg] = useState(currentUser.ProfileImgUrl)

    const saveImageUrlToDatabase = async (formData) => {
        setIsLoading(true);
        try {
            const data = await api.post(`/identity/myprofile/updateImg/`, { formData });
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
        <div className="h-full w-full overflow-y-auto">
            <ImageUpload uploadToBackend={saveImageUrlToDatabase} profileImg={userProfileImg} />

            {isLoading && <LoadingModal />}
            {apiError && <ApiExceptionModal error={apiError} onClose={() => setApiError(null)} />}
        </div>
    );

}

export default SettingsView;