"use server";
import { revalidatePath } from "next/cache";
import { ObjectId } from "mongodb"; // Or the equivalent from mongoose if using that.

import Plant from "models/Plant";
import IndividualPlant from "models/IndividualPlant";
import { getAllPlants } from "lib/db/plants";
import { uploadFile, uploadFileToS3 } from "./UploadActions";
import { getSession } from "lib/getSession";
import sharp from "sharp";
import axios from "axios";
import dbConnect from "lib/db/setup";

export async function PlantHandler() {
  try {
    const result = await getAllPlants();
    console.log("Result:", result);
    //   if (result.success === true) {
    //     console.log("success");
    // setNewModules(result.data);
    return JSON.stringify(result);
  } catch (error) {
    console.error("Error submitting form:", error);
    // Handle the error as needed
  }
}

export async function getPlants() {
  try {
    const result = await getAllPlants();
    console.log("Result:", result);
    //   if (result.success === true) {
    //     console.log("success");
    // setNewModules(result.data);
    return result;
  } catch (error) {
    console.error("Error submitting form:", error);
    // Handle the error as needed
  }
}

// Load Individual Plant data
export async function getPlant(id) {
  await dbConnect();
  /* find all the data in our database */
  const result = await Plant.findOne({ _id: id }, ["-createdAt", "-updatedAt"]);
  const plant = result;
  console.log("Plant:", result);
  // plant._id = String(plant._id);
  return plant;
}

// Update Plant data
export async function updatePlant(formData) {
  console.log("PlantActions- updatePlant:", formData);
  const rawFormData = {
    commonName: formData.commonName,
    scientificName: formData.scientificName,
    family: formData.family,
    tags: formData.tags,
    notes: formData.notes,
    color: formData.color,
  };
  console.log("Raw Form Data:", rawFormData);

  const result = await Plant.findByIdAndUpdate(formData._id, formData);
  return JSON.stringify(result);
}

// Update Plant Family data
export async function updatePlantFamily(family, color) {
  console.log("PlantActions- updatePlantFamily:", family, color);
  const result = await Plant.updateMany(
    { family: family },
    { $set: { "color.family": color } }
  );
  console.log("updated plant family:", result);
  revalidatePath("/");

  return JSON.stringify(result);
}

// Load Plant data from Trefle API
export async function loadTrefleData(link) {
  // console.log("Link load trefle data:", link);
  try {
    const response = await fetch(
      `https://trefle.io${link}?token=${process.env.TREFLE_API_KEY}`
    );
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error("Error loading Trefle data:", error);
    return [];
  }
}

// IndividualPlants
export async function getIndividualPlants() {
  await dbConnect();

  /* find all the data in our database */
  const result = await IndividualPlant.find({ deleted: false }, [
    "-createdAt",
    "-updatedAt",
  ]);
  const plants = result;
  console.log("Plants:", result);

  return plants;
}

export async function getRandomPlant() {
  await dbConnect();
  const result = await Plant.aggregate([{ $sample: { size: 1 } }]);
  // const randomPlant = JSON.stringify(result[0])
  return result[0];
}
// Create Plants
export async function savePlantInputs(PlantList) {
  console.log("PlantActions- savePlantInputs:", PlantList);

  // Create all the plants
  const newPlants = await Promise.all(
    PlantList.map((plant) => IndividualPlant.create(plant))
  );

  // Then populate all the plants
  const populatedPlants = await Promise.all(
    newPlants.map((plant) =>
      IndividualPlant.findById(plant._id).populate({
        path: "module",
        select: "x y",
      })
    )
  );
  revalidatePath("/");

  return JSON.stringify(populatedPlants);
}
// export async function savePlantInputs(PlantList) {
//   console.log("PlantActions- savePlantInputs:", PlantList);
//   const result = await IndividualPlant.create(PlantList).populate({
//     path: "module",
//     // match: { sectionId: section._id },
//     select: "x y",
//   });
//   return JSON.stringify(result);
// }

export async function removeIndividualPlants({ individualPlantIds, reason }) {
  console.log("PlantActions- removeIndividualPlants:", individualPlantIds);
  if (reason == "edit" || reason == "delete") {
    const result = await IndividualPlant.deleteMany({
      _id: { $in: individualPlantIds },
    });
    console.log("Removed plants:", result);
    return JSON.stringify(result);
  }
  const result = await IndividualPlant.updateMany(
    { _id: { $in: individualPlantIds } },
    { $set: { deleted: true, deleteReason: reason } }
  );
  console.log("Removed plants:", result);
  revalidatePath("/");
  return JSON.stringify(result);
}

// Generate 4x3 thumbnail
export async function generateThumbnail(file) {
  const folderName = "plants/botanic_photo/4x3";
  const fileName = `${file.name}`;
  console.log("Generate Thumbnail:", file);
  const fileBuffer = Buffer.from(await file.arrayBuffer());

  const resizedBuffer = await sharp(fileBuffer)
    .jpeg({ quality: 90 })
    .resize({
      width: 560,
      height: 420,
      fit: sharp.fit.cover,
      position: sharp.strategy.entropy,
    })
    .toBuffer();
  const res = await uploadFileToS3(resizedBuffer, fileName, folderName);
  return res;
}

// Add Plant Image to images array
export async function CreatePlantImage(formData) {
  console.log("CreatePlantImage:", formData);
  try {
    const fields = {
      plantId: formData.get("plantId"),
      file: formData.get("file"),
      url: formData.get("url"),
      description: formData.get("description"),
      quality: formData.get("quality"),
      isOriginal: formData.get("isOriginal"),
      isMainImage: formData.get("isMainImage"),
      imageSubject: formData.get("imageSubject"),
    };
    console.log("Fields:", fields.file);
    if (fields.url) {
      try {
        const response = await axios.get(fields.url, {
          responseType: "arraybuffer",
        });
        // Create a Blob from the response data
        const imageBlob = new Blob([response.data], { type: "image/jpeg" }); // Assuming you know the type or can detect it
        const imageFile = new File([imageBlob], "downloadedImage.jpg", {
          type: "image/jpeg", // Ensure correct MIME type
          lastModified: new Date().getTime(), // Current timestamp as lastModified
          name: "downloadedImage.jpg", // File name
        });
      } catch (error) {
        console.error("Error downloading image:", error);
      }
    }
    if (fields.isMainImage) {
      const newThumbnail = await generateThumbnail(fields.file);
      const updatedThumb = await Plant.findByIdAndUpdate(
        fields.plantId,
        {
          thumbnail: newThumbnail,
        },
        { new: true }
      );
      console.log("Updated Thumbnail:", updatedThumb);
    }
    if (fields.file) {
      const imageUrl = await UploadPlantImage(formData);
      fields.url = imageUrl;
    }
    if (!fields.url || fields.url === "") {
      return "Add image or URL";
    }
    const data = {
      url: fields.url,
      tags: fields.imageSubject.split(", "),
      description: fields.description,
      quality: parseInt(fields.quality),
      original: fields.isOriginal === "true" ? true : false,
    };
    console.log("Data:", data);
    const newPlant = await Plant.findOneAndUpdate(
      { _id: fields.plantId },
      { $push: { images: { data } } },
      { new: true }
    );
    // console.log("Updated Plant:", updatedPlant);
    revalidatePath("/");

    return "updatePlant";
  } catch (error) {
    console.error("Error uploading to database:", error);
    return "Upload failed";
  }
}

// Upload Plant Image to S3
export const UploadPlantImage = async (formData) => {
  const timestamp = Date.now();
  try {
    // const res = uploadFile(formData);
    console.log("UploadPlantImage:");
    const file = formData.get("file");
    const folderName = "plants/images";
    const fileName = `${timestamp}_${file.name}`;
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const res = await uploadFileToS3(fileBuffer, fileName, folderName);
    console.log("UploadPlantImage:", res);
    return res;
  } catch (e) {
    console.error("Error uploading file:", e);
    return "Image Upload failed";
  }
};
