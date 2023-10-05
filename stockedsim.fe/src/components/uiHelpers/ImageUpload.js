import React, { useState } from 'react';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

function ImageUpload({ imgUrl, uploadToBackend }) {
    const [image, setImage] = useState(imgUrl);
    const [crop, setCrop] = useState({ aspect: 1 });
    const [croppedImage, setCroppedImage] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();

            reader.onloadend = () => {
                const imageElement = new Image();
                imageElement.onload = () => {
                    setImage(imageElement.src);
                };
                imageElement.src = reader.result;
            };

            reader.readAsDataURL(file);
        }
    };

    const handleSave = () => {
        if (croppedImage) {
            fetch(croppedImage)
                .then(res => res.blob())
                .then(blob => {
                    const formData = new FormData();
                    formData.append('imageFile', blob, 'profilePic.png');
                    uploadToBackend(formData);
                    setIsModalOpen(false);
                });
        }
    };

    const onCropComplete = crop => {
        if (image && crop.width && crop.height) {
            const croppedImageUrl = getCroppedImg(image, crop);
            setCroppedImage(croppedImageUrl);
        }
    };

    const getCroppedImg = (imageSrc, crop) => {
        const imageElement = new Image();
        imageElement.src = imageSrc;

        const canvas = document.createElement('canvas');

        canvas.width = 350;
        canvas.height = 350;
        const ctx = canvas.getContext('2d');

        const scaleX = imageElement.naturalWidth / imageElement.width;
        const scaleY = imageElement.naturalHeight / imageElement.height;

        ctx.drawImage(
            imageElement,
            crop.x * scaleX,
            crop.y * scaleY,
            crop.width * scaleX,
            crop.height * scaleY,
            0,
            0,
            350, 
            350  
        );

        return canvas.toDataURL('image/png');
    };

    return (
        <div className="w-full h-full">
            <button
                onClick={() => setIsModalOpen(true)}
                className="bg-blue-500 text-white px-4 py-2 rounded-md transition hover:bg-blue-600"
            >
                Change profile picture
            </button>

            {isModalOpen && (
                <div className="fixed inset-0 flex items-center justify-center z-50">
                    <div className="absolute inset-0 bg-black opacity-50"></div>

                    <div className="bg-white p-4 rounded-lg relative z-10 max-w-screen-md max-h-screen-md flex flex-col items-center justify-center">
                        <input type="file" onChange={handleImageChange} className="mb-4" />

                        {image && (
                            <>
                                <ReactCrop
                                    src={image}
                                    crop={crop}
                                    onChange={newCrop => setCrop(newCrop)}
                                    onComplete={onCropComplete}
                                    style={{ maxHeight: '100%', maxWidth: '100%' }}
                                >
                                    <img src={image} alt={"Crop"} style={{ maxHeight: '100%', maxWidth: '100%' }} />
                                </ReactCrop>
                                <div className="mt-4">
                                    <button onClick={handleSave} className="bg-green-500 text-white px-4 py-2 rounded-md mr-2 transition hover:bg-green-600">Save</button>
                                    <button onClick={() => setIsModalOpen(false)} className="text-red-500 px-4 py-2 rounded-md transition hover:text-red-600">Cancel</button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default ImageUpload;
