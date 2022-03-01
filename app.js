const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const dbPath = path.join(__dirname, "covid19India.db");

const app = express();
app.use(express.json());
let db = null;

const estConnectionDb = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("connection started successfully");
    });
  } catch (e) {
    console.log(e.message);
    process.exit(1);
  }
};

estConnectionDb();

//let's start

const convertDbObjToRes = (obj) => {
  return {
    stateId: obj.state_id,
    stateName: obj.state_name,
    population: obj.population,
  };
};

const convertDistrictObjToRes = (obj) => {
  return {
    districtId: obj.district_id,
    districtName: obj.district_name,
    stateId: obj.state_id,
    cases: obj.cases,
    cured: obj.cured,
    active: obj.active,
    deaths: obj.deaths,
  };
};

app.get("/states/", async (request, response) => {
  const dbCode = `
    select
        *
    from
        state`;
  const statesArray = await db.all(dbCode);
  response.send(statesArray.map((eachState) => convertDbObjToRes(eachState)));
});

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const dbCode2 = `
    select 
        *
    from
        state
    where
        state_id = ${stateId}`;
  const state1 = await db.get(dbCode2);
  response.send(convertDbObjToRes(state1));
});

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const dbCode4 = `
    select 
        *
    from
        district
    where
        district_id = ${districtId}`;
  const district1 = await db.get(dbCode4);
  response.send(convertDistrictObjToRes(district1));
});

app.post("/districts/", async (request, response) => {
  const { stateId, districtName, cases, cured, active, deaths } = request.body;
  const dbCode3 = `
    insert
        into
    district (state_id, district_name, cases, cured, active, deaths)
    values
        (${stateId}, '${districtName}', ${cases}, ${cured}, ${active}, ${deaths})`;
  await db.run(dbCode3);
  response.send("District Successfully Added");
});

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const dbCode5 = `
    delete
        from
    district
        where
            district_id = ${districtId}`;
  await db.run(dbCode5);
  response.send("District Removed");
});

app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const { districtName, stateId, cases, cured, active, deaths } = request.body;

  const dbCode6 = `
    update district
    set
    district_name = '${districtName}',
    state_id = ${stateId},
    cases = ${cases},
    cured = ${cured},
    active = ${active},
    deaths = ${deaths}
    where district_id = ${districtId};`;
  await db.run(dbCode6);
  response.send("District Details Updated");
});

app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const dbCode7 = `
    select
        SUM(cases),
        SUM(cured),
        SUM(active),
        SUM(deaths)
    from 
        district
    where
        state_id = ${stateId};`;
  const stats = await db.get(dbCode7);
  response.send({
    totalCases: stats["SUM(cases)"],
    totalCured: stats["SUM(cured)"],
    totalActive: stats["SUM(active)"],
    totalDeaths: stats["SUM(deaths)"],
  });
});
