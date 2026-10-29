require("dotenv").config();

const mongoose = require("mongoose");
const LearnModule = require("./models/LearnModule");
const Assessment = require("./models/Assessment");
const ensureDefaultAdmin = require("./utils/ensureDefaultAdmin");
const defaultAssessments = require("./data/defaultAssessments");
const modules = require("./data/defaultLearnModules");

const assessments = defaultAssessments;

async function seedDatabase() {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        console.log("MongoDB connected");

        await LearnModule.deleteMany({});

        await LearnModule.insertMany(modules);
        await Assessment.deleteMany({});
        await Assessment.insertMany(assessments);
        await ensureDefaultAdmin();

        console.log(`${modules.length} learning modules and ${assessments.length} assessment inserted`);

        await mongoose.disconnect();

        console.log("Database seeding complete");
        process.exit(0);
    } catch (error) {
        console.error("Seed failed:", error.message);
        process.exit(1);
    }
}

seedDatabase();
