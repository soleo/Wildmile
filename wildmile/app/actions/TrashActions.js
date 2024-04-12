"use server";
import TrashItem from "models/TrashItem";
import IndividualTrashItem from "models/IndividualTrashItem";

export async function updateTrashCount(itemId, logId, quantity) {
  const item = await IndividualTrashItem.findOneAndUpdate(
    { _id: itemId, logId: logId }, // find a document with these properties
    { quantity: quantity }, // update the count property
    {
      new: true, // return the updated document
      upsert: true, // create a new document if no match is found
    }
  );
  return item.count;
}

export async function getItemsFromLog(logId) {
  //   await dbConnect();
  const id = logId; // Get the id from the request parameters
  console.log("id" + id);

  const result = await TrashItem.find({}, [
    "-creator",
    "-__v",
    "-createdAt",
    "-updatedAt",
  ])
    .populate({
      path: "individualTrashItem",
      match: { logId: id },
      model: "IndividualTrashItem",
      select: "-__v -createdAt -updatedAt -deleted -creator",
    })
    .lean();

  const items = result.reduce((acc, doc) => {
    const item = { ...doc }; // Clone the document to avoid mutating the original result
    item._id = item._id.toString();

    // Initialize quantity for each item
    item.quantity = 0;

    // If an IndividualTrashItem was found, accumulate its quantity
    if (item.individualTrashItem) {
      // Ensure correct data types and aggregate quantity
      item.individualTrashItem.forEach((trashItem) => {
        trashItem._id = trashItem._id.toString();
        trashItem.itemId = trashItem.itemId.toString();
        trashItem.logId = trashItem.logId.toString();
        item.quantity += trashItem.quantity; // Accumulate quantities
      });
    }

    // Log for debugging
    console.log("Processed item: ", item);

    // Remove the individualTrashItem property to clean up the final output
    delete item.individualTrashItem;

    // Use the _id of the item as the key in the accumulated results
    acc[item._id] = item;
    return acc;
  }, {});

  console.log("Final aggregated items:", items);
  return { items: items, logId: id };
}
