"use strict";

const issue = require("../models/issue");

module.exports = function (app) {
  app
    .route("/api/issues/:project")

    .get(async function (req, res) {
      const { project } = req.params;
      try {
        const fetchedIssues = await issue.find({
          project_name: project,
          ...req.query,
        });
        return res.status(200).json(fetchedIssues);
      } catch (err) {
        console.error(`GET /api/issues/${project}:`, err);
        return res.json({ error: "could not fetch" });
      }
    })

    .post(async function (req, res) {
      const { project } = req.params;
      const {
        issue_title,
        issue_text,
        created_by,
        assigned_to = "",
        status_text = "",
      } = req.body;

      if (!issue_title || !issue_text || !created_by) {
        return res.json({ error: "required field(s) missing" });
      }

      try {
        const postedIssue = await issue.create({
          project_name: project,
          issue_title,
          issue_text,
          created_by,
          assigned_to,
          status_text,
        });

        return res.status(200).json({
          _id: postedIssue._id,
          issue_title: postedIssue.issue_title,
          issue_text: postedIssue.issue_text,
          created_by: postedIssue.created_by,
          assigned_to: postedIssue.assigned_to,
          status_text: postedIssue.status_text,
          created_on: postedIssue.created_on,
          updated_on: postedIssue.updated_on,
          open: postedIssue.open,
        });
      } catch (err) {
        console.error(`POST /api/issues/${project}:`, err);
        return res.json({
          error: "could not create issue",
        });
      }
    })

    .put(async function (req, res) {
      const { project } = req.params;
      const {
        _id,
        issue_title,
        issue_text,
        created_by,
        assigned_to,
        status_text,
        open,
      } = req.body;

      if (!_id) {
        return res.json({ error: "missing _id" });
      }

      if (
        typeof issue_title === "undefined" &&
        typeof issue_text === "undefined" &&
        typeof created_by === "undefined" &&
        typeof assigned_to === "undefined" &&
        typeof status_text === "undefined" &&
        typeof open === "undefined"
      ) {
        return res.json({
          error: "no update field(s) sent",
          _id,
        });
      }

      try {
        const updatedIssue = await issue.findOneAndUpdate(
          {
            _id,
            project_name: project,
          },
          {
            issue_title,
            issue_text,
            created_by,
            assigned_to,
            status_text,
            open,
            updated_on: new Date(),
          }
        );

        return res.json({
          result: "successfully updated",
          _id: updatedIssue._id.toString(),
        });
      } catch (err) {
        // console.error(`PUT /api/issues/${project}:`, err);
        return res.json({
          error: "could not update",
          _id,
        });
      }
    })

    .delete(async function (req, res) {
      const { project } = req.params;
      const { _id } = req.body;

      if (!_id) {
        return res.json({ error: "missing _id" });
      }

      try {
        const deletedIssue = await issue.findOneAndDelete({
          project_name: project,
          _id,
        });

        return res.json({
          result: "successfully deleted",
          _id: deletedIssue._id,
        });
      } catch (err) {
        // console.error(`DELETE /api/issues/${project}:`, err);
        return res.json({
          error: "could not delete",
          _id,
        });
      }
    });
};
