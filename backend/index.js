import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "API Agenda Médica funcionando 🚀" });
});

app.listen(3001, () => console.log("Backend rodando na porta 3001"));
