const express = require("express");
const bodyParser = require("body-parser");

const results = require("./mocks/queries/ResultLarge.json");
const update = require("./mocks/queries/Update.json");
const structure = require("./mocks/structures/Default.json");
const dragonsOntology = require("./mocks/ontology/dragons/ontology.json");
const linkedinOntology = require("./mocks/ontology/linkedin/ontology.json");

// Map of available ontologies
const ontologies = {
  dragons: dragonsOntology,
  linkedin: linkedinOntology
};

// Legacy support - default to dragons
const ontology = dragonsOntology;

const app = express();
const port = process.env.PORT || 5001;

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  next();
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.post("/api/results", (req, res) => {
  if (req.body.collapsed) {
    console.log("Request for collapsed data received: ", req.body);
    res.send(results);
  } else {
    console.log("Request received: ", req.body);
    res.send(results);
  }
});

app.post("/api/update", (req, res) => {
  res.send(update);
});

app.get("/api/ontology", (req, res) => {
  // Support query parameter for selecting ontology: /api/ontology?type=linkedin
  const ontologyType = req.query.type || 'dragons';
  const selectedOntology = ontologies[ontologyType] || ontology;
  console.log(`Serving ontology: ${ontologyType}`);
  res.send(selectedOntology);
});

// Get list of available ontologies
app.get("/api/ontologies", (req, res) => {
  res.send({
    ontologies: [
      { id: "dragons", name: "Dragons", description: "Dragons fantasy ontology with persons, dragons, horses, kingdoms, and guilds" },
      { id: "linkedin", name: "LinkedIn", description: "LinkedIn professional network ontology with persons, companies, positions, skills, and connections" }
    ]
  });
});

app.get("/api/structure", (req, res) => {
  res.send(structure);
});

app.get("/api/schema", (req, res) => {
  res.send({
    schema: [
      { label: "Schema A", id: "A" },
      { label: "Schema B", id: "B" },
      { label: "Schema C", id: "C" },
      { label: "Schema D", id: "D" },
      { label: "Schema E", id: "E" }
    ]
  });
});

app.get("/api/schema/:id", (req, res) => {
  console.log("getting schema: ", req.params);
  if (!req.params.id) {
    res.status(400).send({
      message: "No schema selected"
    });
  } else {
    res.send({
      A: {
        label: "Schema A",
        value: `query SampleQuery {
        person {
          name
          friends {
            name
          }
        }
      }`
      }
    });
  }
});

app.post("/api/schema", (req, res) => {
  const label = req.body.label;
  const value = req.body.value;
  console.log("Set schema: ", label, value);
  if (!label) {
    res.status(400).send({
      message: "No label included"
    });
  } else {
    res.send({ status: "Success" });
  }
});

if (require.main === module) {
  app.listen(port, () => console.log(`Listening on port ${port}`));
}

module.exports = app;
