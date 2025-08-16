import { removeBackground } from 'react-native-background-remover';

// Helper: Convert blob to base64
const blobToBase64 = (blob) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

export const removeBackgroundFromImageUri = async (imageUri) => {
  try {
    // const formData = new FormData();
    // formData.append("file", {
    //   uri: imageUri,
    //   name: "upload.png",
    //   type: "image/png",
    // });


    // // 🧠 Change localhost to your local IP for real device testing
    // const response = await fetch("http://10.188.31.173:8000/remove-bg", {
    //   method: "POST",
    //   body: formData,
    // });

    // if (!response.ok) {
    //   throw new Error("Failed to remove background");
    // }

    // const blob = await response.blob();

    // // Convert blob to base64
    // const base64 = await blobToBase64(blob);

    // // Save it to local file system
    // const outputUri = FileSystem.documentDirectory + "bg_removed_" + Date.now() + ".png";
    // await FileSystem.writeAsStringAsync(outputUri, base64, {
    //   encoding: FileSystem.EncodingType.Base64,
    // });

    // return outputUri;

    const backgroundRemovedImageURI = await removeBackground(imageUri, {
      quality: 1,
      size: "small",
    });
    return backgroundRemovedImageURI
  } catch (error) {
    //console.log("BG Removal Failed:", error);
    return null;
  }
};

