import express from "express";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
import cors from "cors";
import streamifier from "streamifier";
import fs from "fs";
import poster from "./poster.json" assert { type: "json" };

dotenv.config();

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.json());

// --- Configuration Cloudinary ---
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET
});

// --- Sauvegarder dans poster.json ---
const savePosters = () => {
  fs.writeFileSync("./poster.json", JSON.stringify(poster, null, 2), "utf-8");
};

// --- Fonction d'ajout de lien ---
const addPosterLink = (username, film, link) => {
  console.log(`Ajout du lien pour ${username} - ${film} : ${link}`);
  
  if (!poster[username]) {
    poster[username] = {};
  }
  
  poster[username][film] = link;
  savePosters(); // ✅ Sauvegarde dans le fichier
  return {"username":username, "film" : film, "url":link};
};

// --- Route d'upload ---
app.post("/upload", upload.single("poster"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "Aucun fichier reçu" });
  if (!req.body.film) return res.status(400).json({ error: "Aucun nom de film reçu" });
  if (!req.body.username) return res.status(400).json({ error: "Aucun nom d'utilisateur reçu" });

  const uploadStream = cloudinary.uploader.upload_stream(
    { folder: "letterboxd-posters" },
    (error, result) => {
      if (error) {
        console.error("Erreur Cloudinary :", error);
        return res.status(500).json({ error: error.message });
      }

      const { film, username } = req.body;
      const updatedPosters = addPosterLink(username, film, result.secure_url);
      console.log("Poster uploadé avec succès :", updatedPosters);
      res.json(updatedPosters);
    }
  );

  streamifier.createReadStream(req.file.buffer).pipe(uploadStream);
});

// --- Route d'ajout de lien direct ---
app.post("/link", (req, res) => {
  const { film, username, link } = req.body;
  if (!link) return res.status(400).json({ error: "Aucun lien reçu" });
  if (!film) return res.status(400).json({ error: "Aucun nom de film reçu" });
  if (!username) return res.status(400).json({ error: "Aucun nom d'utilisateur reçu" });
  console.log(`Ajout du lien direct pour ${username} - ${film} : ${link}`);
  const updatedPosters = addPosterLink(username, film, link);
  res.json(updatedPosters);
});

// --- Route de récupération ---
app.get("/:username", (req, res) => {
  const { username } = req.params;
  const userPosters = poster[username] || {};
  res.json(userPosters);
});

// Route de suppression
app.post("/delete", (req, res) => {
  const { username, film } = req.body;
  if (!username || !film) {
    return res.status(400).json({ error: "Nom d'utilisateur ou nom de film manquant" });
  }

  console.log(`Suppression du poster pour ${username} - ${film}`);

  if (poster[username] && poster[username][film]) {
    delete poster[username][film];
    savePosters();
    return res.json({ message: `Poster pour '${film}' supprimé pour l'utilisateur '${username}'` });
  } else {
    return res.status(404).json({ error: "Poster non trouvé" });
  }
});

// --- Démarrage ---
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`🚀 Serveur lancé sur http://localhost:${port}`));
