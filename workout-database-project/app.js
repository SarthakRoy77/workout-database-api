const express = require('express');
const pool = require('./pool.js')
const errorHandler = require('./middleware/errorHandler.js');
const port = 8000

const app = express()
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.post('/api/exercise', async (req, res, next) => {
    const name = req.body.name;
    const description = req.body.description;
    const caloriesBurnt = req.body.calorieBurned;
    const tag = req.body.tag

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

    if (!caloriesBurnt || isNaN(caloriesBurnt)) {
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
        res.status(201).send(rows);

    } catch (err) {
        next(err);
    }

});

app.get('/api/exercise', async (req, res, next) => {
    if (req.query.tag) {
        try {
            const tag = req.query.tag;

            if (!tag || typeof tag !== 'string') {
                const err = new Error('Tag (string) is required');
                err.status = 400;
                return next(err);

            }
            const [rows] = await pool.query("SELECT * FROM exercise WHERE tag = ?", [tag]);
            if (rows.length === 0) {
                return res.status(200).send([]);
            }
            
            res.status(200).send(rows);
        }catch (err) {
            next(err)
        }
    }
    else {

        try {
            const [rows] = await pool.query("SELECT * FROM exercise");

            if (rows.length === 0) {
                return res.status(200).send([])
            }

            res.status(200).send(rows)
        } catch (err) {
            next(err);
        }

    }
});

app.get('/api/exercise/:id', async (req, res, next) => {
    try {
        const id = req.params.id;

        const [rows] = await pool.query("SELECT * FROM exercise WHERE id = ?", [id]);

        if (rows.length === 0) {
            const err = new Error("The id you have given is Invalid, there is no data associated with the id");
            err.status = 404;
            return next(err);
        }

        res.status(200).send(rows)
    } catch (err) {
        next(err);
    }
    });

app.put('/api/exercise/:id', async (req, res, next) => {
    const id = req.params.id;
    const caloriesBurnt = req.body.calorieBurned;
    const tag = req.body.tag

    if (!id || isNaN(id)) {
        const err = new Error('Id (Integer) is required');
        err.status = 400;
        return next(err);
    }

    if (!caloriesBurnt || isNaN(caloriesBurnt)) {
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
        await pool.query("UPDATE exercise SET caloriesBurnt = ?, tag = ? WHERE id = ? ", [caloriesBurnt, tag, id]);
        const [rows] = await pool.query("SELECT * FROM exercise WHERE id = ?", [id]);

        res.status(200).send(rows);

    } catch (err) {
        next(err);
    }

});

app.delete('/api/exercise/:id', async (req, res, next) => {
    try {
        const id = req.params.id;


        if (!id || isNaN(id)) {
            const err = new Error("Id (integer) is required");
            err.status = 400;
            return next(err);
        }

        await pool.query("DELETE FROM exercise WHERE id = ?", [id]);
        const [rows] = await pool.query("SELECT * FROM exercise");

        res.status(200).send({msg : `The data associated with the id ${id} has been successfully deleted, the updated data is ${rows}`});
    } catch (err) {
        next(err);
    }
})

app.use(errorHandler);

app.listen(port, () => {
    console.log(`Listening, on port ${port}`);
})