import RNFS from 'react-native-fs';

export const convertToBase64 = async (uri) => {
  try {
    // react-native-fs requires "file://" scheme removed on Android sometimes
    let path = uri.startsWith('file://') ? uri.replace('file://', '') : uri;

    const base64String = await RNFS.readFile(path, 'base64');
    return base64String;
  } catch (error) {
    console.error('Error converting to base64:', error);
    throw error;
  }
};
