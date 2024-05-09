"use server";
import TrashLog from "models/Trash";
import TrashItem from "models/TrashItem";
import IndividualTrashItem from "models/IndividualTrashItem";
import { cleanObject } from "lib/utils";
import { getSession } from "lib/getSession";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { uploadFileToS3 } from "./UploadActions";
import dbConnect from "lib/db/setup";

export async function updateTrashCount(itemId, logId, quantity) {
  const item = await IndividualTrashItem.findOneAndUpdate(
    { itemId: itemId, logId: logId }, // find a document with these properties
    { quantity: quantity }, // update the count property
    {
      new: true, // return the updated document
      upsert: true, // create a new document if no match is found
    }
  );
  console.log("Updated item: ", item);
  return item.count;
}

export async function getTrashCount(itemId, logId) {
  const item = await IndividualTrashItem.findOne(
    { itemId: itemId, logId: logId }, // find a document with these properties
    { quantity: 1 } // return only the count property
  );
  console.log("Updated item: ", item);
  return item ? item.quantity : 0;
}

export async function CreateLog(values) {
  await dbConnect();
  console.log("Values:", values.site);
  const cleanValues = cleanObject(values);
  const session = await getSession();
  console.log("clean values:", cleanValues);
  // Here you should insert the Log into the database
  const log = await TrashLog.create(
    { ...values, creator: session._id }
    // { ...cleanValues }
  );
  console.log("Log:", log);
  // revalidatePath("/trash"); // Update cached posts
  redirect(`/trash/log/${log._id}`); // Navigate to the new post page
  return { success: true, data: JSON.stringify(log) };
}

export async function getItemsFromLog(useLogId) {
  await dbConnect();
  const id = useLogId; // Get the id from the request parameters
  console.log("id" + id);

  /* find all the data in our database */
  try {
    const trashLog = await TrashLog.findById(id)
      .populate({
        path: "items",
        model: "IndividualTrashItem",
        select: "-__v -createdAt -updatedAt -deleted -creator",
      })
      .lean();

    const trashLogItems = trashLog.items.reduce((acc, doc) => {
      const item = { ...doc };
      item._id = item._id.toString();
      item.itemId = item.itemId.toString();
      item.logId = item.logId.toString();
      item.quantity = item.quantity;
      acc[item.itemId] = item;
      return acc;
    }, {});

    const result = await TrashItem.find(
      { deleted: false, creator: "5e94888191fc50001775feb5" },
      [
        "-creator",
        "-__v",
        "-createdAt",
        "-updatedAt",
        // "-deleted",
      ]
    ).lean();
    const items = result.reduce((acc, doc) => {
      const item = { ...doc }; // Clone the document to avoid mutating the original result
      item._id = item._id.toString();
      item.quantity = 0;
      item.values = {};
      acc[item._id] = item;
      return acc;
    }, {});
    for (const itemId of Object.keys(trashLogItems)) {
      const updatedItem = items[itemId];
      if (updatedItem) {
        updatedItem.quantity = trashLogItems[itemId].quantity;
        updatedItem.values = trashLogItems[itemId];
      }
    }
    // const items = result;
    return { items: items, logId: id };
  } catch (error) {
    console.error("Error looking for trash items from log:", error);
  }
}

export const UploadTrashImage = async (formData) => {
  const timestamp = Date.now();
  try {
    // const res = uploadFile(formData);
    console.log("UploadPlantImage:");
    const file = formData.get("file");
    const folderName = "trash/images";
    const fileName = `${timestamp}_${file.name}`;
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const res = await uploadFileToS3(fileBuffer, fileName, folderName);
    console.log("UploadPlantImage:", res);
    return { success: true, url: res };
  } catch (e) {
    console.error("Error uploading file:", e);
    return { success: false, error: e };
  }
};
