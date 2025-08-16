import { convertToBase64 } from "../utils/convertToBase64";
import {HUGGING_FACE_TOKEN } from "@env";

export const uriToBase64 = async (uri) => {
    const base64 = await convertToBase64(uri);
    return base64;
};

export const predictWithYusyelModel = async (imageUri) => {

  // //console.log(JSON.stringify({
  //       data: [`data:image/jpeg;base64,${imageUri}`],
  //     }))

try {
   

    const response = await fetch("https://yusyel-clothing.hf.space/run/predict", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        data: [`data:image/jpeg;base64,${imageUri}`],
      }),
    });

    const result = await response.json();
    //console.log("Clothing Classification Result:", result);

    return result.data;
  } catch (err) {
    console.error("Error classifying clothing:", err);
    return null;
  }
};

export const predictWithYusyelModelMulti = async (base64Array) => {
  try {
    const dataPayload = {
      data: base64Array.map((b64) => `data:image/jpeg;base64,${b64}`),
    };

    const response = await fetch("https://yusyel-clothing.hf.space/run/predict", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(dataPayload),
    });

    const result = await response.json();
    //console.log("Batch Clothing Classification Result:", result);

    return result.data; // array of predictions
  } catch (err) {
    console.error("Batch Classification Error:", err);
    return null;
  }
};


export const predictProductType = async (imageBlob) => {
  const app = await client("https://umbuz-product-categorizer-v2.hf.space/");
  const result = await app.predict("/predict", [imageBlob]);
  return result.data;
};
