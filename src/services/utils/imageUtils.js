import ImageResizer from 'react-native-image-resizer';
import RNFS from 'react-native-fs';

/**
 * Convert file URI to Blob (CLI version)
 */
export const getBlobFromUri = async (uri) => {
  try {
    const fileData = await RNFS.readFile(uri, 'base64');
    const blob = Buffer.from(fileData, 'base64');
    return blob;
  } catch (error) {
    console.error('Error converting URI to Blob:', error);
    return null;
  }
};

/**
 * Resize image and get Base64 (CLI version)
 */
export const getBase64FromUri = async (uri) => {
  try {
    const resizedImage = await ImageResizer.createResizedImage(
      uri,
      256, // width
      256, // height
      'JPEG', // format
      80 // quality
    );

    const base64 = await RNFS.readFile(resizedImage.uri, 'base64');
    return base64;
  } catch (error) {
    console.error('Error resizing and converting to base64:', error);
    return null;
  }
};
