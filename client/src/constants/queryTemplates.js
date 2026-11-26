// Predefined query templates per ontology. Values match the data of the sample each
// ontology ships with (the Dragons values match the yang-db Dragons tutorial data).

const queryTemplates = {
  dragons: [
    {
      description: "Find all persons by first name",
      query: {
        combinator: "and",
        rules: [
          {
            field: "Person.firstName",
            operator: "notNull",
            value: null
          }
        ]
      }
    },
    {
      description: "Find dragons with specific color",
      query: {
        combinator: "and",
        rules: [
          {
            field: "Dragon.color",
            operator: "=",
            value: "BLACK"
          }
        ]
      }
    },
    {
      description: "Find entities with multiple attributes",
      query: {
        combinator: "and",
        rules: [
          {
            field: "Person.firstName",
            operator: "notNull",
            value: null
          },
          {
            field: "Person.lastName",
            operator: "notNull",
            value: null
          }
        ]
      }
    },
    {
      description: "Find entities using OR condition",
      query: {
        combinator: "or",
        rules: [
          {
            field: "Dragon.color",
            operator: "=",
            value: "RED"
          },
          {
            field: "Dragon.color",
            operator: "=",
            value: "BLUE"
          }
        ]
      }
    },
    {
      description: "Complex nested query example",
      query: {
        combinator: "and",
        rules: [
          {
            field: "Person.firstName",
            operator: "notNull",
            value: null
          },
          {
            combinator: "or",
            rules: [
              {
                field: "Person.gender",
                operator: "=",
                value: "MALE"
              },
              {
                field: "Person.gender",
                operator: "=",
                value: "FEMALE"
              }
            ]
          }
        ]
      }
    },
    {
      description: "Find dragons owned by persons (relationship)",
      query: {
        combinator: "and",
        rules: [
          {
            field: "Person",
            operator: "Own",
            value: "Dragon"
          }
        ]
      }
    },
    {
      description: "Find persons who are members of guilds (relationship)",
      query: {
        combinator: "and",
        rules: [
          {
            field: "Person",
            operator: "MemberOf",
            value: "Guild"
          }
        ]
      }
    },
    {
      description: "Find persons who know someone named Christiana (complex)",
      query: {
        combinator: "and",
        rules: [
          {
            field: "Person",
            operator: "Know",
            value: "Person"
          },
          {
            field: "Person.firstName",
            operator: "=",
            value: "Christiana"
          }
        ]
      }
    },
    {
      description: "Persons with a black dragon that fired on a dragon, and a horse from a funded kingdom (advanced)",
      query: {
        combinator: "and",
        rules: [
          {
            field: "Person",
            operator: "Own",
            value: "Dragon"
          },
          {
            field: "Dragon.color",
            operator: "=",
            value: "BLACK"
          },
          {
            combinator: "and",
            rules: [
              {
                field: "Dragon",
                operator: "Fire",
                value: "Dragon"
              },
              {
                field: "Person",
                operator: "Own",
                value: "Horse"
              },
              {
                field: "Horse",
                operator: "OriginatedIn",
                value: "Kingdom"
              },
              {
                field: "Kingdom.funds",
                operator: ">",
                value: "0"
              }
            ]
          }
        ]
      }
    }
  ],
  linkedin: [
    {
      description: "Find all persons by name",
      query: {
        combinator: "and",
        rules: [
          {
            field: "Person.name",
            operator: "notNull",
            value: null
          }
        ]
      }
    },
    {
      description: "Find companies with specific attributes",
      query: {
        combinator: "and",
        rules: [
          {
            field: "Company.name",
            operator: "=",
            value: ""
          }
        ]
      }
    },
    {
      description: "Find entities with multiple attributes",
      query: {
        combinator: "and",
        rules: [
          {
            field: "Person.name",
            operator: "notNull",
            value: null
          },
          {
            field: "Person.email",
            operator: "contains",
            value: "@"
          }
        ]
      }
    },
    {
      description: "Find entities using OR condition",
      query: {
        combinator: "or",
        rules: [
          {
            field: "Company.industry",
            operator: "=",
            value: "Technology"
          },
          {
            field: "Company.industry",
            operator: "=",
            value: "Finance"
          }
        ]
      }
    },
    {
      description: "Complex nested query example",
      query: {
        combinator: "and",
        rules: [
          {
            field: "Person.name",
            operator: "notNull",
            value: null
          },
          {
            combinator: "or",
            rules: [
              {
                field: "Person.title",
                operator: "contains",
                value: "Engineer"
              },
              {
                field: "Person.title",
                operator: "contains",
                value: "Developer"
              }
            ]
          }
        ]
      }
    },
    {
      description: "Find persons working at companies (relationship)",
      query: {
        combinator: "and",
        rules: [
          {
            field: "Person",
            operator: "WorksAt",
            value: "Company"
          }
        ]
      }
    },
    {
      description: "Find persons connected to other persons (relationship)",
      query: {
        combinator: "and",
        rules: [
          {
            field: "Person",
            operator: "ConnectedTo",
            value: "Person"
          }
        ]
      }
    },
    {
      description: "Find companies founded by persons (relationship)",
      query: {
        combinator: "and",
        rules: [
          {
            field: "Person",
            operator: "Founded",
            value: "Company"
          }
        ]
      }
    },
    {
      description: "Find persons connected to someone named John (complex)",
      query: {
        combinator: "and",
        rules: [
          {
            field: "Person",
            operator: "ConnectedTo",
            value: "Person"
          },
          {
            field: "Person.name",
            operator: "=",
            value: "John Smith"
          }
        ]
      }
    },
    {
      description: "Multi-relationship LinkedIn query (advanced)",
      query: {
        combinator: "and",
        rules: [
          {
            field: "Person",
            operator: "WorksAt",
            value: "Company"
          },
          {
            field: "Company.industry",
            operator: "=",
            value: "Technology"
          },
          {
            combinator: "and",
            rules: [
              {
                field: "Person",
                operator: "ConnectedTo",
                value: "Person"
              },
              {
                combinator: "and",
                rules: [
                  {
                    field: "Person",
                    operator: "Founded",
                    value: "Company"
                  },
                  {
                    field: "Person.title",
                    operator: "contains",
                    value: "CEO"
                  }
                ]
              }
            ]
          }
        ]
      }
    }
  ],
  flights: [
    {
      description: "Find all flights by flight number",
      query: {
        combinator: "and",
        rules: [
          {
            field: "Flight.flightNum",
            operator: "notNull",
            value: null
          }
        ]
      }
    },
    {
      description: "Find flights by carrier",
      query: {
        combinator: "and",
        rules: [
          {
            field: "Flight.carrier",
            operator: "=",
            value: "OpenSearch-Air"
          }
        ]
      }
    },
    {
      description: "Find delayed flights",
      query: {
        combinator: "and",
        rules: [
          {
            field: "Flight.flightDelay",
            operator: "=",
            value: "true"
          }
        ]
      }
    },
    {
      description: "Find flights with price range",
      query: {
        combinator: "and",
        rules: [
          {
            field: "Flight.avgTicketPrice",
            operator: ">",
            value: "500"
          },
          {
            field: "Flight.avgTicketPrice",
            operator: "<",
            value: "1000"
          }
        ]
      }
    },
    {
      description: "Find flights using OR condition (multiple carriers)",
      query: {
        combinator: "or",
        rules: [
          {
            field: "Flight.carrier",
            operator: "=",
            value: "OpenSearch-Air"
          },
          {
            field: "Flight.carrier",
            operator: "=",
            value: "Logstash Airways"
          }
        ]
      }
    },
    {
      description: "Find flights with origin airport (relationship)",
      query: {
        combinator: "and",
        rules: [
          {
            field: "Flight",
            operator: "OriginAirport",
            value: "Airport"
          }
        ]
      }
    },
    {
      description: "Find flights with destination airport (relationship)",
      query: {
        combinator: "and",
        rules: [
          {
            field: "Flight",
            operator: "DestinationAirport",
            value: "Airport"
          }
        ]
      }
    },
    {
      description: "Find flights operated by carrier (relationship)",
      query: {
        combinator: "and",
        rules: [
          {
            field: "Flight",
            operator: "OperatedBy",
            value: "Carrier"
          }
        ]
      }
    },
    {
      description: "Find airports that connect to other airports (relationship)",
      query: {
        combinator: "and",
        rules: [
          {
            field: "Airport",
            operator: "ConnectsTo",
            value: "Airport"
          }
        ]
      }
    },
    {
      description: "Complex flight query with relationships and conditions (advanced)",
      query: {
        combinator: "and",
        rules: [
          {
            field: "Flight",
            operator: "OriginAirport",
            value: "Airport"
          },
          {
            field: "Airport.country",
            operator: "=",
            value: "US"
          },
          {
            combinator: "and",
            rules: [
              {
                field: "Flight",
                operator: "OperatedBy",
                value: "Carrier"
              },
              {
                field: "Flight.avgTicketPrice",
                operator: "<",
                value: "800"
              }
            ]
          }
        ]
      }
    }
  ]
};

export default queryTemplates;
