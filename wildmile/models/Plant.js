// "use server";
import mongoose from "mongoose";

const PlantImageSchema = new mongoose.Schema(
  {
    url: { type: String, default: "" },
    tags: { type: Array, default: [] },
    description: { type: String, required: false, default: "" },
    quality: { type: Number, min: 1, max: 5, default: 3 },
    original: { type: Boolean, default: false },
  }
  // { _id: false }
);
// copyright: String,
// metadata: Object,
// });

const PlantSchema = new mongoose.Schema(
  {
    scientific_name: { type: String, unique: true, required: true },
    common_name: String,
    family: String,
    family_common_name: String,
    genus: String,
    genus_id: Number,
    notes: String,
    image_url: String,
    synonyms: Array,
    year: Number,
    links: Object,
    thumbnail: String,
    color: {
      main: { type: String, default: "" },
      accent: { type: String, default: "" },
      family: { type: String, default: "#aeb6bd" },
      swatches: { type: Array, default: [] },
    },
    // pics: [PlantImageSchema],
    images: { type: [PlantImageSchema], default: [] },

    // images: [
    //   {
    //     url: { type: String, default: "" },
    //     tags: { type: Array, default: [] },
    //     description: { type: String, required: false },
    //     // quality: { type: Number, min: 1, max: 5, default: 3 },
    //     // original: { type: Boolean, default: false },
    //   },
    // ],
    tags: Array,
  },
  { timestamps: true }
);

export default mongoose.models.Plant || mongoose.model("Plant", PlantSchema);
// Basing off of https://docs.trefle.io/docs/advanced/plants-fields
// image tag options: flower, fruit, leaf, bark, habit, other, seed, root, stem, whole, drawing
// Other tag options for lifecycle stages: seedling, juvenile, budding, flowering, fruiting, seeding, dormant

// import mongoose from "mongoose";

// const PlantSchema = new mongoose.Schema(
//   {
//     scientific_name: { type: String, unique: true },
//     common_name: String,
//     family: String,
//     family_common_name: String,
//     genus: String,
//     genus_id: Number,
//     notes: String,
//     image_url: String,
//     thumbnail: String,
// images: [
//   {
//     url: String,
//     tags: { type: Array, default: [], required: false },
//     description: String,
//     quality: { type: Number, default: 3 },
//     original: Boolean,
//     copyright: String,
//     metadata: Object,
//   },
// ],
//     tags: Array,
//     foliage: { texture: String, color: Array, leaf_retention: Boolean },
//     flower: { color: Array, conspicuous: Boolean },
//     fruit_or_seed: {
//       color: Array,
//       conspicuous: Boolean,
//       shape: String,
//       seed_persistence: Boolean,
//     },
//     specifications: {
//       growth_habit: String,
//       growth_rate: String,
//       max_height: Number,
//       max_width: Number,
//       nitrogen_fixation: Boolean,
//       shape_and_orientation: String,
//       toxicity: String,
//     },
//     growth: {
//       light: String,
//       ph: String,
//       moisture: String,
//       soil_salinity: Number,
//       soil_texture: Number,
//       soil_humidity: Number,
//       soil_nutriments: Number,
//       spread: Object,
//       row_spacing: Object,
//       growth_months: Array,
//       bloom_months: Array,
//       fruit_months: Array,
//       precipitation_min: Number,
//       precipitation_max: Number,
//       root_depth_min: Number,
//       temperature_min: Number,
//       bloom_period: String,
//       sowing: String,
//       description: String,
//     },
//     synonyms: Array,
//     year: Number,
//     links: Object,
//     color: { main: String, accent: String, swatches: Array },
//   },
//   { timestamps: true }
// );

// export default mongoose.models.Plant || mongoose.model("Plant", PlantSchema);
