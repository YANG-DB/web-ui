const express = require("express");
const bodyParser = require("body-parser");

const results = require("./mocks/queries/Result");
const update = require("./mocks/queries/Update");
const structure = require("./mocks/structures/Default");
const ontology = require("./mocks/ontologies/Dragons.json");

const app = express();
const port = process.env.PORT || 5000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.post("/api/results", (req, res) => {
  console.log("Request received: ", req.body);
  res.send(results);
});

app.post("/api/update", (req, res) => {
  res.send(update);
});

app.get("/api/ontology", (req, res) => {
  res.send(ontology);
});

app.get("/api/structure", (req, res) => {
  res.send(structure);
});

app.listen(port, () => console.log(`Listening on port ${port}`));
