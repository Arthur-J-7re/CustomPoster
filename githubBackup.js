import simpleGit from "simple-git";
import fs from "fs";
import dotenv from "dotenv";

const GITHUB_REPO = `https://${process.env.GITHUB_TOKEN}@github.com/Arthur-J-7re/CustomPosterJson.git`;
const BRANCH = "main";
const FILE = "poster.json"; // nom du fichier dans le repo
const TMP_DIR = "./tmp-backup";

const git = simpleGit();


export const backupJSON = async () => {
  try {
    const git = simpleGit();

    // Clone du repo si pas encore fait
    if (!fs.existsSync(TMP_DIR)) {
      console.log("📥 Clone du repo de backup...");
      await git.clone(GITHUB_REPO, TMP_DIR);
    }

    const repo = simpleGit(TMP_DIR);

    // Assure-toi d'être sur la bonne branche
    await repo.checkout(BRANCH);
    await repo.pull("origin", BRANCH);

    await repo.addConfig("user.name", "Render Bot");
    await repo.addConfig("user.email", "bot@render.com");

    // Copie du fichier JSON dans le repo
    fs.copyFileSync(FILE, `${TMP_DIR}/${FILE}`);

    // Commit en écrasant le précédent (amend)
    await repo.add(FILE);

    await repo.commit("Backup automatique (modification)", {
      "--amend": null,
      "--no-edit": null
    });

    // Push forcé pour écraser l’ancien commit
    await repo.push("origin", BRANCH, { "--force": null });

    console.log("💾 Backup GitHub effectué avec succès !");
  } catch (err) {
    console.error("❌ Erreur lors du backup GitHub :", err);
  }
};

export const restoreJSON = async () => {
  try {
    // Clone ou update le repo
    if (!fs.existsSync(TMP_DIR)) {
      await git.clone(GITHUB_REPO, TMP_DIR);
    }
    const tmpGit = simpleGit(TMP_DIR);
    await tmpGit.checkout(BRANCH);
    await tmpGit.pull("origin", BRANCH);

    // Copie le JSON dans le projet
    fs.copyFileSync(`${TMP_DIR}/${FILE}`, FILE);
    console.log("✅ poster.json restauré depuis GitHub !");
  } catch (err) {
    console.error("❌ Erreur restoreJSON :", err);
  }
};
