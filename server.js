const express = require("express");
const bodyParser = require("body-parser");

const results = require("./mocks/queries/ResultLarge");
const update = require("./mocks/queries/Update");
const structure = require("./mocks/structures/Default");
const ontology = require("./mocks/ontologies/Dragons.json");

const app = express();
const port = process.env.PORT || 5000;

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
  res.send(ontology);
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

app.listen(port, () => console.log(`Listening on port ${port}`));
