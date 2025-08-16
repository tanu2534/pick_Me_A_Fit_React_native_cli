import axios from "axios";
import {HUGGING_FACE_TOKEN } from "@env";

export const classifyUmbuz = async (base64Image) => {
  try {
    const response = await axios.post(
      "https://umbuz-product-categorizer-v2.hf.space/run/predict",
      {
        data: [`data:image/jpeg;base64,${base64Image}`],
      },
      {
        headers: {
          Authorization: `Bearer ${ HUGGING_FACE_TOKEN }`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data.data[0];
  } catch (error) {
    console.error("Umbuz API Error:", error);
    return null;
  }
};
