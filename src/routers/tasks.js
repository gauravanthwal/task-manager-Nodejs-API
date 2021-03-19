const express = require('express');
const Task = require('../models/tasks.js');
const auth = require('../middleware/auth.js');
const router = express.Router();


router.post("/tasks",auth, async (req, res) => {
  try {
    // const task = new Task(req.body);
    const task = new Task({
      ...req.body,
      owner: req.user._id
    })
    await task.save();
    res.status(201).send(task);
  } catch (e) {
    res.status(400).send(e);
  }
});
// GET /tasks?completed=true
// GET /tasks?limit=4&skip=3
// GET /tasks?createdAt:asc/desc
router.get("/tasks",auth, async (req, res) => {
  try {
    const match = {}
    const sort = {}

    if(req.query.completed){
      match.completed = req.query.completed === 'true'
    }
    if(req.query.sortBy){
      const parts = req.query.sortBy.split(':')
      sort[parts[0]] = parts[1] === 'desc' ? -1 :1 
    }

    await req.user.populate({
      path: 'tasks',
      match,
      options: {
        limit: parseInt(req.query.limit),
        skip: parseInt(req.query.skip),
        sort
      }
    }).execPopulate()
    res.status(200).send(req.user.tasks);
  } catch (e) {
    res.status(404).send(e);
  }
});
router.get("/tasks/:id",auth, async (req, res) => {
  const _id = req.params.id;
  try {
    // const task = await Task.findById(_id);
    const task = await Task.findOne({_id, owner: req.user.id})
    
    res.status(200).send(task);
  } catch (e) {
    res.status(404).send(e);
  }
});
router.patch("/tasks/:id",auth, async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedOperations = ["description", "completed"];
  const isValidOpreation = updates.every((update) =>
    allowedOperations.includes(update)
  );

  if (!isValidOpreation) {
    return res.status(400).send("bad update request!");
  }
  try {
    //   const task = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true,runValidators: true,});
    const task = await Task.findOne({_id: req.params.id, owner: req.user._id})
    if (!task) {
      res.status(404).send("task not found!");
    }
    updates.forEach(update => task[update] = req.body[update]);
    await task.save();
    res.send(task);
  } catch (err) {
    res.status(400).send(err.message);
  }
});
router.delete("/tasks/:id",auth, async (req, res) => {
  try {
    const task = await Task.findOne({_id:req.params.id, owner: req.user._id});
    if (!task) {
      return res.status(404).send("not removed");
    }
    await task.remove();
    res.send({ message: "successfully remonved task", task });
  } catch (err) {
    res.send(err);
    console.log(err);
  }
});



module.exports = router;