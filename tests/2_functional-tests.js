const chaiHttp = require("chai-http");
const chai = require("chai");
const assert = chai.assert;
const server = require("../server");
const issue = require("../models/issue");

chai.use(chaiHttp);

suite("Functional Tests", function () {
  const endpoint = "/api/issues/apitest";

  suite("Creating Issues", () => {
    test(`POST ${endpoint} - Create an issue with every field.`, async () => {
      const res = await chai.request(server).post(endpoint).send({
        issue_title: "This is a test issue.",
        issue_text: "This is the description of the issue.",
        created_by: "Someone",
        assigned_to: "Someone",
        status_text: "Submitted",
      });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.type, "application/json");
      assert.strictEqual(res.body.issue_title, "This is a test issue.");
      assert.strictEqual(
        res.body.issue_text,
        "This is the description of the issue."
      );
      assert.strictEqual(res.body.created_by, "Someone");
      assert.strictEqual(res.body.assigned_to, "Someone");
      assert.strictEqual(res.body.status_text, "Submitted");
      assert.strictEqual(res.body.open, true);
    });

    test(`POST ${endpoint} - Create an issue with only required fields.`, async () => {
      const res = await chai.request(server).post(endpoint).send({
        issue_title: "This is a test issue with only required fields.",
        issue_text: "This is the description of the issue.",
        created_by: "Someone",
      });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.type, "application/json");
      assert.strictEqual(
        res.body.issue_title,
        "This is a test issue with only required fields."
      );
      assert.strictEqual(
        res.body.issue_text,
        "This is the description of the issue."
      );
      assert.strictEqual(res.body.created_by, "Someone");
      assert.strictEqual(res.body.assigned_to, "");
      assert.strictEqual(res.body.status_text, "");
      assert.strictEqual(res.body.open, true);
    });

    test(`POST ${endpoint} - Create an issue with missing required fields.`, async () => {
      const res = await chai.request(server).post(endpoint).send({
        issue_title: "This is a test issue with missing required fields.",
      });

      assert.strictEqual(res.type, "application/json");
      assert.strictEqual(res.body.error, "required field(s) missing");
    });
  });

  suite(`Reading Issues`, () => {
    test(`GET ${endpoint} - View issues on a project.`, async () => {
      const res = await chai.request(server).get(endpoint);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.type, "application/json");

      assert.isArray(res.body);
    });

    test(`GET ${endpoint}?open=true - View issues on a project with one filter.`, async () => {
      const res = await chai.request(server).get(`${endpoint}?open=true`);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.type, "application/json");

      const filtered = res.body.filter((issue) => issue.open === true);

      assert.strictEqual(res.body.length, filtered.length);
    });

    test(`GET ${endpoint}?open=true&status_text=Submitted - View issues on a project with multiple filters.`, async () => {
      const res = await chai
        .request(server)
        .get(`${endpoint}?open=true&status_text=Submitted`);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.type, "application/json");

      const filtered = res.body.filter(
        (issue) => issue.open === true && issue.status_text === "Submitted"
      );

      assert.strictEqual(res.body.length, filtered.length);
    });

    this.afterAll(async () => {
      await issue.deleteMany({ created_by: "Someone" });
    });
  });

  suite("Updating Issues", () => {
    this.beforeAll(async () => {
      await issue.create({
        project_name: "apitest",
        issue_title: "Issue",
        issue_text: "Description",
        created_by: "Someone",
        assigned_to: "Someone",
        status_text: "Not Updated",
      });
    });

    test(`PUT ${endpoint} - Update one field on an issue.`, async () => {
      const fetchedIssue = await issue.findOne({ project_name: "apitest" });

      const res = await chai
        .request(server)
        .put(endpoint)
        .send({ _id: fetchedIssue._id, issue_title: "Updated Issue" });

      assert.strictEqual(res.body.result, "successfully updated");
      assert.strictEqual(res.body._id, fetchedIssue._id.toString());
    });

    test(`PUT ${endpoint} - Update multiple fields on an issue.`, async () => {
      const fetchedIssue = await issue.findOne({ project_name: "apitest" });

      const res = await chai.request(server).put(endpoint).send({
        _id: fetchedIssue._id,
        issue_text: "Updated Description",
        status_text: "Updated",
        assigned_to: "The Solver",
      });

      assert.strictEqual(res.body.result, "successfully updated");
      assert.strictEqual(res.body._id, fetchedIssue._id.toString());
    });

    test(`PUT ${endpoint} - Update an issue with missing '_id'.`, async () => {
      const res = await chai.request(server).put(endpoint).send({
        issue_text: "Updated Description",
        status_text: "Updated",
        assigned_to: "The Solver",
      });

      assert.strictEqual(res.body.error, "missing _id");
    });

    test(`PUT ${endpoint} - Update an issue with no fields to update.`, async () => {
      const fetchedIssue = await issue.findOne({ project_name: "apitest" });

      const res = await chai.request(server).put(endpoint).send({
        _id: fetchedIssue._id,
      });

      assert.strictEqual(res.body.error, "no update field(s) sent");
      assert.strictEqual(res.body._id, fetchedIssue._id.toString());
    });

    test(`PUT ${endpoint} - Update an issue with an invalid '_id'`, async () => {
      const res = await chai
        .request(server)
        .put(endpoint)
        .send({ _id: "NOT_A_VALID_OBJECTID", issue_title: "Updated Issue" });

      assert.strictEqual(res.body.error, "could not update");
      assert.strictEqual(res.body._id, "NOT_A_VALID_OBJECTID");
    });

    this.afterAll(async () => {
      await issue.deleteMany({ created_by: "Someone" });
    });
  });

  suite("Deleting Issues", () => {
    this.beforeAll(async () => {
      await issue.create({
        project_name: "apitest",
        issue_title: "Issue",
        issue_text: "Description",
        created_by: "Someone",
        assigned_to: "Someone",
        status_text: "Not Updated",
      });
    });

    test(`DELETE ${endpoint} - Delete an issue.`, async () => {
      const fetchedIssue = await issue.findOne({ project_name: "apitest" });

      const res = await chai
        .request(server)
        .delete(endpoint)
        .send({ _id: fetchedIssue._id });

      assert.strictEqual(res.type, "application/json");
      assert.strictEqual(res.body.result, "successfully deleted");
      assert.strictEqual(res.body._id, fetchedIssue._id.toString());
    });

    test(`DELETE ${endpoint} - Delete an issue with an invalid '_id'.`, async () => {
      const res = await chai
        .request(server)
        .delete(endpoint)
        .send({ _id: "NOT_A_VALID_OBJECTID" });

      assert.strictEqual(res.type, "application/json");
      assert.strictEqual(res.body.error, "could not delete");
      assert.strictEqual(res.body._id, "NOT_A_VALID_OBJECTID");
    });

    test(`DELETE ${endpoint} - Delete an issue with missing '_id'.`, async () => {
      const res = await chai
        .request(server)
        .delete(endpoint)
        .send({ _id: undefined });

      assert.strictEqual(res.type, "application/json");
      assert.strictEqual(res.body.error, "missing _id");
    });
  });
});
