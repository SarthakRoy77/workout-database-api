const express = require('express');
const cors = require('cors'); // Required to prevent React browser blocks
const pool = require('./pool.js');
const errorHandler = require('./middleware/errorHandler.js');
const port = process.env.PORT || 8000;

const server = express();

// Global Middleware
server.use(cors()); // Allows your React app to communicate with this API
server.use(express.json());
server.use(express.urlencoded({ extended: false }));

// POST: Create exercise
server.post('/api/exercise', async (req, res, next) => {
    const name = req.body.name;
    const description = req.body.description;
    const caloriesBurnt = req.body.calorieBurned;
    const tag = req.body.tag;

    if (!name || typeof name !== 'string') {
        const err = new Error('Name (string) is required');
        err.status = 400;
        return next(err);
    }

    if (!description || typeof description !== 'string') {
        const err = new Error('Description (string) is required');
        err.status = 400;
        return next(err);
    }

    if (caloriesBurnt === undefined || caloriesBurnt === null || isNaN(caloriesBurnt)) {
        const err = new Error('Amount of Calories Burnt (integer) is required');
        err.status = 400;
        return next(err);
    }

    if (!tag || typeof tag !== 'string') {
        const err = new Error('A tag (string) is required');
        err.status = 400;
        return next(err);
    }

    try {
        const [result] = await pool.query(`INSERT INTO exercise(name, description, caloriesBurnt, tag) VALUES (?, ?, ?, ?)`, [name, description, caloriesBurnt, tag]);
        const newId = result.insertId;
        const [rows] = await pool.query('SELECT * FROM exercise WHERE id = ? ', [newId]);
        res.status(201).json(rows);
    } catch (err) {
        next(err);
    }
});

// GET: Fetch exercises (All or by Tag)
server.get('/api/exercise', async (req, res, next) => {
    if (req.query.tag) {
        try {
            const tag = req.query.tag;
            if (typeof tag !== 'string') {
                const err = new Error('Tag (string) is required');
                err.status = 400;
                return next(err);
            }
            const [rows] = await pool.query("SELECT * FROM exercise WHERE tag = ?", [tag]);
            res.status(200).json(rows);
        } catch (err) {
            next(err);
        }
    } else {
        try {
            const [rows] = await pool.query("SELECT * FROM exercise");
            res.status(200).json(rows);
        } catch (err) {
            next(err);
        }
    }
});

// GET: Fetch exercise by ID
server.get('/api/exercise/:id', async (req, res, next) => {
    try {
        const id = req.params.id;
        const [rows] = await pool.query("SELECT * FROM exercise WHERE id = ?", [id]);

        if (rows.length === 0) {
            const err = new Error("The id you have given is Invalid, there is no data associated with the id");
            err.status = 404;
            return next(err);
        }

        res.status(200).json(rows);
    } catch (err) {
        next(err);
    }
});

// PUT: Update exercise
server.put('/api/exercise/:id', async (req, res, next) => {
    const id = req.params.id;
    const caloriesBurnt = req.body.calorieBurned;
    const tag = req.body.tag;

    if (!id || isNaN(id)) {
        const err = new Error('Id (Integer) is required');
        err.status = 400;
        return next(err);
    }

    if (caloriesBurnt === undefined || caloriesBurnt === null || isNaN(caloriesBurnt)) {
        const err = new Error('Amount of Calories Burnt (integer) is required');
        err.status = 400;
        return next(err);
    }

    if (!tag || typeof tag !== 'string') {
        const err = new Error('A tag (string) is required');
        err.status = 400;
        return next(err);
    }

    try {
        const [existing] = await pool.query("SELECT * FROM exercise WHERE id = ?", [id]);
        if (existing.length === 0) {
            const err = new Error("Exercise not found");
            err.status = 404;
            return next(err);
        }

        await pool.query("UPDATE exercise SET caloriesBurnt = ?, tag = ? WHERE id = ? ", [caloriesBurnt, tag, id]);
        const [rows] = await pool.query("SELECT * FROM exercise WHERE id = ?", [id]);
        res.status(200).json(rows);
    } catch (err) {
        next(err);
    }
});

// DELETE: Remove exercise
server.delete('/api/exercise/:id', async (req, res, next) => {
    try {
        const id = req.params.id;

        if (!id || isNaN(id)) {
            const err = new Error("Id (integer) is required");
            err.status = 400;
            return next(err);
        }

        await pool.query("DELETE FROM exercise WHERE id = ?", [id]);
        const [rows] = await pool.query("SELECT * FROM exercise");

        res.status(200).json({
            msg: `The data associated with the id ${id} has been successfully deleted.`,
            updatedData: rows
        });
    } catch (err) {
        next(err);
    }
});

// Error handling initialization
server.use(errorHandler);

// Crucial step: Export the app module instance for Vercel Serverless environment
module.exports = server;
