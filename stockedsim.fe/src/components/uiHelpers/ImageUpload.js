import React, { useRef, useState } from 'react';
import AvatarEditor from 'react-avatar-editor';

function ImageUpload({ imgUrl, uploadToBackend }) {
    const [image, setImage] = useState(imgUrl || '/DefaultProfileImg.png');
    const editorRef = useRef(null);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        const reader = new FileReader();

        reader.onloadend = () => {
            setImage(reader.result);
        };

        if (file) {
            reader.readAsDataURL(file);
        }
    };

    const handleSave = () => {
        if (editorRef.current) {
            editorRef.current.getImageScaledToCanvas().toBlob(blob => {
                const formData = new FormData();
                formData.append('imageFile', blob, 'profilePic.png');  

                uploadToBackend(formData);
            });
        }
    };

    return (
        <div>
            <input type="file" onChange={handleImageChange} />
            {image && (
                <div>
                    <AvatarEditor
                        ref={editorRef}
                        image={image}
                        width={250}
                        height={250}
                        border={50}
                        color={[255, 255, 255, 0.6]}
                        scale={1.2}
                    />
                    <button onClick={handleSave}>Save</button>
                </div>
            )}
        </div>
    );
}

export default ImageUpload;
