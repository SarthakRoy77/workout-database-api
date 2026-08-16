const errorHandler = (err, req, res, _next) => {
    if (err.status) {
        return res.status(err.status).send({msg : err.message});
    }
    else {
        return res.status(500).send({msg : err.message || "An Error has occurred, please try again"});
    }
}

module.exports = errorHandler;