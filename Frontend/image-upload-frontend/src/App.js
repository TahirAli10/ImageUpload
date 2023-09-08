import React, { useState, useEffect } from 'react';
import axios from 'axios';

function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [images, setImages] = useState([]);
  const [imageId, setImageId] = useState(""); // Define imageId state
  const [imageSrc, setImageSrc] = useState("");
  console.log("image id ",imageId)
  useEffect(() => {
    // Fetch the Base64-encoded image data from your backend
    if (imageId) { // Only fetch when imageId is defined
      fetch(`http://localhost:8080/images/${imageId}`)
        .then((response) => response.arrayBuffer()) // Convert response to ArrayBuffer
        .then((buffer) => {
          const blob = new Blob([buffer]); 
          const imageUrl = URL.createObjectURL(blob); 
          console.log("blob",imageUrl)
          setImageSrc(imageUrl);
          
        })
        .catch((error) => console.error(error));
    }
  }, [imageId]);
 console.log( "imageSrc", imageSrc)
  useEffect(() => {
    // Fetch the list of uploaded images when the component mounts
    axios.get('http://localhost:8080/images')
      .then(response => {
        setImages(response?.data?.files);
      })
      .catch(error => {
        console.error('Error fetching images:', error);
      });
  }, []);

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleUpload = () => {
    const formData = new FormData();
    formData.append('avatar', selectedFile);

    axios.post('http://localhost:8080/upload/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    .then(response => {
      setUploadedFile(response.data);
      setSelectedFile(null);
    })
    .catch(error => {
      console.error('Error uploading image:', error);
    });
  };

  const handleDownload = (filename) => {
    window.open(`/download/${filename}`, '_blank');
  };
  console.log(images)
  return (
    <div className="App">
      <h1>Image Upload and Download</h1>
      
      <form encType="multipart/form-data">
        <input type="file" onChange={handleFileChange} />
        <button onClick={handleUpload}>Upload Image</button>
      </form>

      {uploadedFile && (
        <div>
          <h2>Uploaded Image:</h2>
          <p>ID: {uploadedFile.id}</p>
          <p>Name: {uploadedFile.name}</p>
          <p>Content Type: {uploadedFile.contentType}</p>
        </div>
      )}

      <h2>Images:</h2>
      <ul>
        {images.map((image, index) => (
          <li key={index}>
            {image.filename}{' '}
            <button onClick={() => {
              setImageId(image._id); 
            }}>
              Show Image 
            </button>
            
          </li>
        ))}
      </ul>
      <div>
        {imageSrc && <img src={imageSrc} alt="Image" />}
      </div>
    </div>
  );
}

export default App;
