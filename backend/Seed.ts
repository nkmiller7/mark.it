import { ObjectId } from "mongodb";
import { userDataMethods } from "./src/data/users";
import { jobDataMethods } from "./src/data/jobs";
import { taskDataMethods } from "./src/data/tasks";
import { ownerDataMethods } from "./src/data/owner";
import { validationMethods } from "./src/validation";
import { MongoClient } from "mongodb";
import { firebaseApp } from "./src/initializeFirebase";
import { getAuth } from "firebase-admin/auth";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const firebaseAuth = getAuth(firebaseApp);

import path from "path";
import fs from "fs";
import { randomUUID } from "crypto";

const s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
});

(async () => {

const client = await MongoClient.connect(String(process.env.MONGO_DB_URI));
await client.db(String(process.env.MONGO_DB_NAME)).dropDatabase();
await client.close();

// Clear all Firebase users
let nextPageToken: string | undefined = undefined;
do {
    const listResult = await firebaseAuth.listUsers(1000, nextPageToken);
    if (listResult.users.length > 0) {
        await firebaseAuth.deleteUsers(listResult.users.map((u) => u.uid));
    }
    nextPageToken = listResult.pageToken;
} while (nextPageToken);
//Helpers

const IMAGES_DIR = path.resolve("seed_images/seed_images");

function fileObj(filePath: string) {
    const filename = path.basename(filePath);
    const mimetype = "image/png" as string;
    return { path: filePath, filename, mimetype };
}

async function seedAssetsForTask(
    taskId: ObjectId,
    fileNames: string[],
): Promise<void> {
    const files = fileNames.map((f) => fileObj(path.join(IMAGES_DIR, f)));
    const task = await taskDataMethods.getTaskById(taskId.toString());
    const ext = ".png";
    let uploaded:{ key: string; source: "s3" | "local" }[] = [];
    for(let f of files){
        const s3Key = `${task.jobId.toString()}/${taskId.toString()}/${randomUUID()}${ext}`;
        await s3.send(
            new PutObjectCommand({
                Bucket: process.env.S3_BUCKET_NAME,
                Key: s3Key,
                Body: fs.readFileSync(f.path),
                ContentType: "image/png",
            })
        );
        uploaded.push({key: s3Key, source: "s3"});
    }
    await ownerDataMethods.createAssetsForTask(taskId, uploaded);
}

function imgs(prefix: string, count: number): string[] {
    return Array.from({ length: count }, (_, i) => `${prefix}_asset${i + 1}.png`);
}

const labelers = [
    { email: "labeler1@markit.com", firstName: "James",  lastName: "Thornton", password: "Thornton!2" },
    { email: "labeler2@markit.com", firstName: "Sofia",  lastName: "Reyes",    password: "Reyes!3"    },
    { email: "labeler3@markit.com", firstName: "Marcus", lastName: "Chen",     password: "Chen!4"     },
    { email: "labeler4@markit.com", firstName: "Priya",  lastName: "Kapoor",   password: "Kapoor!5"   },
    { email: "labeler5@markit.com", firstName: "Daniel", lastName: "Walsh",    password: "Walsh!6"    },
];

for (const { password, ...l } of labelers) {
    await userDataMethods.createUser({ ...l, type: "labeler", rating: 0 });
    await firebaseAuth.createUser({ email: l.email, password });
}

const reviewers = [
    { email: "reviewer1@markit.com", firstName: "Elena",  lastName: "Novak",    password: "Novak!7"    },
    { email: "reviewer2@markit.com", firstName: "Omar",   lastName: "Hassan",   password: "Hassan!8"   },
    { email: "reviewer3@markit.com", firstName: "Claire", lastName: "Fontaine", password: "Fontaine!9" },
    { email: "reviewer4@markit.com", firstName: "Raj",    lastName: "Patel",    password: "Patel!10"   },
    { email: "reviewer5@markit.com", firstName: "Yuki",   lastName: "Tanaka",   password: "Tanaka!11"  },
];

for (const { password, ...r } of reviewers) {
    await userDataMethods.createUser({ ...r, type: "reviewer", rating: 0 });
    await firebaseAuth.createUser({ email: r.email, password });
}

const owner1 = { email: "quant@alphariver.com",    entityName: "Alpha River Capital",  password: "AlphaRiver!12"  };
const owner2 = { email: "data@meridianquant.com",  entityName: "Meridian Quant Group", password: "Meridian!13"    };
const owner3 = { email: "research@ironledger.com", entityName: "Iron Ledger Research", password: "IronLedger!14"  };

const owner1Id = await userDataMethods.createUser({ email: owner1.email, entityName: owner1.entityName, type: "owner" });
await firebaseAuth.createUser({ email: owner1.email, password: owner1.password });

const owner2Id = await userDataMethods.createUser({ email: owner2.email, entityName: owner2.entityName, type: "owner" });
await firebaseAuth.createUser({ email: owner2.email, password: owner2.password });

const owner3Id = await userDataMethods.createUser({ email: owner3.email, entityName: owner3.entityName, type: "owner" });
await firebaseAuth.createUser({ email: owner3.email, password: owner3.password });

//Alpha River Capital

const arc_job1Id = await jobDataMethods.createJob({
    ownerId: owner1Id,
    description: "Label intraday S&P 500 candlestick patterns as breakout, reversal, or consolidation.",
    deadlineDate: "2026-06-01",
    ratingRequired: { labeler: 0, reviewer: 0 },
});

const arc1_t1 = await taskDataMethods.createTask({
    jobId: arc_job1Id,
    description: "Classify this 5-minute SPY candlestick cluster observed during market open.",
    schema: ["Breakout", "Reversal", "Consolidation"],
    assignedLabelerId: null, assignedReviewerId: null, status: "unlabeled",
});
await seedAssetsForTask(arc1_t1, imgs("arc1_t1", 5));

const arc1_t2 = await taskDataMethods.createTask({
    jobId: arc_job1Id,
    description: "Classify this 15-minute ES futures candlestick pattern near a key resistance level.",
    schema: ["Breakout", "Reversal", "Consolidation"],
    assignedLabelerId: null, assignedReviewerId: null, status: "unlabeled",
});
await seedAssetsForTask(arc1_t2, imgs("arc1_t2", 5));

const arc1_t3 = await taskDataMethods.createTask({
    jobId: arc_job1Id,
    description: "Classify this hourly SPX candlestick sequence observed following a CPI release.",
    schema: ["Breakout", "Reversal", "Consolidation"],
    assignedLabelerId: null, assignedReviewerId: null, status: "unlabeled",
});
await seedAssetsForTask(arc1_t3, imgs("arc1_t3", 5));

const arc_job2Id = await jobDataMethods.createJob({
    ownerId: owner1Id,
    description: "Classify earnings call transcripts by sentiment: bullish, bearish, or neutral.",
    deadlineDate: "2026-06-15",
    ratingRequired: { labeler: 1, reviewer: 2 },
});

for (let t = 1; t <= 4; t++) {
    const descriptions = [
        "Label this Q3 earnings call excerpt from a large-cap technology company.",
        "Label this CFO commentary segment discussing forward guidance and margin outlook.",
        "Label this analyst Q&A exchange from a mid-cap financial services earnings call.",
        "Label this CEO opening statement from a consumer discretionary company earnings call.",
    ];
    const taskId = await taskDataMethods.createTask({
        jobId: arc_job2Id,
        description: descriptions[t - 1],
        schema: ["Bullish", "Bearish", "Neutral"],
        assignedLabelerId: null, assignedReviewerId: null, status: "unlabeled",
    });
    await seedAssetsForTask(taskId, imgs(`arc2_t${t}`, 5));
}

const arc_job3Id = await jobDataMethods.createJob({
    ownerId: owner1Id,
    description: "Annotate order book snapshots with liquidity regime labels for HFT model training.",
    deadlineDate: "2026-07-01",
    ratingRequired: { labeler: 2, reviewer: 3 },
});

const arc3Descriptions = [
    "Label this NASDAQ Level 2 order book snapshot captured during pre-market hours.",
    "Label this CME futures order book snapshot taken 30 seconds before FOMC announcement.",
    "Label this mid-session NYSE order book snapshot for a large-cap energy stock.",
    "Label this order book snapshot captured during a flash spike in the VIX index.",
    "Label this closing auction order book snapshot for an S&P 500 index rebalance day.",
];
for (let t = 1; t <= 5; t++) {
    const taskId = await taskDataMethods.createTask({
        jobId: arc_job3Id,
        description: arc3Descriptions[t - 1],
        schema: ["Deep Liquidity", "Thin Liquidity", "Imbalanced", "Crossed Market"],
        assignedLabelerId: null, assignedReviewerId: null, status: "unlabeled",
    });
    await seedAssetsForTask(taskId, imgs(`arc3_t${t}`, 5));
}

// Meridian Quant Group 

const mqg_job1Id = await jobDataMethods.createJob({
    ownerId: owner2Id,
    description: "Tag Fed meeting minutes excerpts by hawkish or dovish policy signal strength.",
    deadlineDate: "2026-06-20",
    ratingRequired: { labeler: 0, reviewer: 1 },
});

const mqg1Descriptions = [
    "Tag this excerpt from the January FOMC minutes discussing inflation trajectory.",
    "Tag this passage from FOMC minutes referencing labor market tightness and wage growth.",
    "Tag this section of Fed minutes addressing the pace of balance sheet reduction.",
];
for (let t = 1; t <= 3; t++) {
    const taskId = await taskDataMethods.createTask({
        jobId: mqg_job1Id,
        description: mqg1Descriptions[t - 1],
        schema: ["Strongly Hawkish", "Mildly Hawkish", "Neutral", "Mildly Dovish", "Strongly Dovish"],
        assignedLabelerId: null, assignedReviewerId: null, status: "unlabeled",
    });
    await seedAssetsForTask(taskId, imgs(`mqg1_t${t}`, 5));
}

const mqg_job2Id = await jobDataMethods.createJob({
    ownerId: owner2Id,
    description: "Label forex tick data sequences as trend, range-bound, or volatility spike.",
    deadlineDate: "2026-07-10",
    ratingRequired: { labeler: 1, reviewer: 2 },
});

const mqg2Descriptions = [
    "Label this EUR/USD tick sequence recorded during the London-New York session overlap.",
    "Label this USD/JPY tick sequence captured immediately following a BOJ rate decision.",
    "Label this GBP/USD tick sequence observed during a low-liquidity Asian session.",
    "Label this AUD/USD tick sequence following a surprise Australian employment print.",
];
for (let t = 1; t <= 4; t++) {
    const taskId = await taskDataMethods.createTask({
        jobId: mqg_job2Id,
        description: mqg2Descriptions[t - 1],
        schema: ["Trend", "Range-Bound", "Volatility Spike"],
        assignedLabelerId: null, assignedReviewerId: null, status: "unlabeled",
    });
    await seedAssetsForTask(taskId, imgs(`mqg2_t${t}`, 5));
}

const mqg_job3Id = await jobDataMethods.createJob({
    ownerId: owner2Id,
    description: "Classify equity analyst reports by recommendation: buy, hold, sell, or neutral.",
    deadlineDate: "2026-07-20",
    ratingRequired: { labeler: 2, reviewer: 2 },
});

const mqg3Descriptions = [
    "Classify this initiating coverage report on a semiconductor company from a bulge bracket.",
    "Classify this ratings update report following a missed EPS estimate in consumer staples.",
    "Classify this sector rotation note from a regional bank research desk.",
];
for (let t = 1; t <= 3; t++) {
    const taskId = await taskDataMethods.createTask({
        jobId: mqg_job3Id,
        description: mqg3Descriptions[t - 1],
        schema: ["Buy", "Hold", "Sell", "Neutral"],
        assignedLabelerId: null, assignedReviewerId: null, status: "unlabeled",
    });
    await seedAssetsForTask(taskId, imgs(`mqg3_t${t}`, 5));
}

const mqg_job4Id = await jobDataMethods.createJob({
    ownerId: owner2Id,
    description: "Annotate credit default swap spread movements with macroeconomic event triggers.",
    deadlineDate: "2026-08-01",
    ratingRequired: { labeler: 3, reviewer: 4 },
});

const mqg4Descriptions = [
    "Annotate this IG CDS spread widening event observed on a non-farm payrolls release day.",
    "Annotate this HY CDS spread compression during a period of declining Treasury yields.",
    "Annotate this sovereign CDS spread spike for an emerging market during a USD rally.",
];
for (let t = 1; t <= 3; t++) {
    const taskId = await taskDataMethods.createTask({
        jobId: mqg_job4Id,
        description: mqg4Descriptions[t - 1],
        schema: ["Rate Decision", "Inflation Print", "Employment Data", "Geopolitical Event", "Earnings Shock", "Liquidity Crisis", "Unexplained"],
        assignedLabelerId: null, assignedReviewerId: null, status: "unlabeled",
    });
    await seedAssetsForTask(taskId, imgs(`mqg4_t${t}`, 5));
}

//Iron Ledger Research

const ilr_job1Id = await jobDataMethods.createJob({
    ownerId: owner3Id,
    description: "Label on-chain Bitcoin transaction graphs as exchange inflow, outflow, or wallet consolidation.",
    deadlineDate: "2026-06-30",
    ratingRequired: { labeler: 0, reviewer: 0 },
});

const ilr1Descriptions = [
    "Label this on-chain BTC transaction graph showing a cluster of UTXOs moving to a known exchange address.",
    "Label this BTC transaction graph originating from a cold storage wallet with fan-out outputs.",
    "Label this high-frequency BTC transaction graph observed during a period of price discovery.",
    "Label this BTC graph showing multiple small inputs being merged into a single large UTXO.",
];
for (let t = 1; t <= 4; t++) {
    const taskId = await taskDataMethods.createTask({
        jobId: ilr_job1Id,
        description: ilr1Descriptions[t - 1],
        schema: ["Exchange Inflow", "Exchange Outflow", "Wallet Consolidation"],
        assignedLabelerId: null, assignedReviewerId: null, status: "unlabeled",
    });
    await seedAssetsForTask(taskId, imgs(`ilr1_t${t}`, 5));
}

const ilr_job2Id = await jobDataMethods.createJob({
    ownerId: owner3Id,
    description: "Classify financial news headlines by market impact: high, medium, low, or negligible.",
    deadlineDate: "2026-07-15",
    ratingRequired: { labeler: 1, reviewer: 1 },
});

const ilr2Descriptions = [
    "Classify this Reuters headline announcing an unexpected 50bps Fed rate hike.",
    "Classify this Bloomberg headline covering a routine Treasury auction result.",
    "Classify this WSJ headline reporting a major bank failure and FDIC intervention.",
];
for (let t = 1; t <= 3; t++) {
    const taskId = await taskDataMethods.createTask({
        jobId: ilr_job2Id,
        description: ilr2Descriptions[t - 1],
        schema: ["High Impact", "Medium Impact", "Low Impact", "Negligible Impact"],
        assignedLabelerId: null, assignedReviewerId: null, status: "unlabeled",
    });
    await seedAssetsForTask(taskId, imgs(`ilr2_t${t}`, 5));
}

const ilr_job3Id = await jobDataMethods.createJob({
    ownerId: owner3Id,
    description: "Annotate commodity futures curve shapes as contango, backwardation, or flat.",
    deadlineDate: "2026-08-10",
    ratingRequired: { labeler: 2, reviewer: 3 },
});

const ilr3Descriptions = [
    "Annotate this WTI crude oil futures curve snapshot taken during a supply glut period.",
    "Annotate this natural gas futures curve observed ahead of peak winter demand season.",
    "Annotate this gold futures curve shape during a period of elevated real interest rates.",
    "Annotate this soybean futures curve captured during an USDA crop report release week.",
];
for (let t = 1; t <= 4; t++) {
    const taskId = await taskDataMethods.createTask({
        jobId: ilr_job3Id,
        description: ilr3Descriptions[t - 1],
        schema: ["Contango", "Backwardation", "Flat"],
        assignedLabelerId: null, assignedReviewerId: null, status: "unlabeled",
    });
    await seedAssetsForTask(taskId, imgs(`ilr3_t${t}`, 5));
}

const ilr_job4Id = await jobDataMethods.createJob({
    ownerId: owner3Id,
    description: "Tag SEC 10-K risk factor sections by category: market, credit, liquidity, or operational.",
    deadlineDate: "2026-08-20",
    ratingRequired: { labeler: 3, reviewer: 4 },
});

const ilr4Descriptions = [
    "Tag this 10-K risk factor paragraph from a regional bank discussing interest rate sensitivity.",
    "Tag this 10-K passage from an asset manager describing counterparty default exposure.",
    "Tag this 10-K risk section from a fintech firm referencing payment processing outage risks.",
    "Tag this 10-K disclosure from a hedge fund describing redemption risk under stressed conditions.",
    "Tag this 10-K risk factor from an exchange operator addressing cybersecurity and system failures.",
];
for (let t = 1; t <= 5; t++) {
    const taskId = await taskDataMethods.createTask({
        jobId: ilr_job4Id,
        description: ilr4Descriptions[t - 1],
        schema: ["Market Risk", "Credit Risk", "Liquidity Risk", "Operational Risk"],
        assignedLabelerId: null, assignedReviewerId: null, status: "unlabeled",
    });
    await seedAssetsForTask(taskId, imgs(`ilr4_t${t}`, 5));
}

console.log("Seed complete.");
process.exit(0);
})();